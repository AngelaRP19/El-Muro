const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Launching Puppeteer E2E UI Tests...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Helper to wait and click
  const waitAndClick = async (selector) => {
    await page.waitForSelector(selector, { visible: true });
    await page.click(selector);
  };

  // Helper to wait and type
  const waitAndType = async (selector, text) => {
    await page.waitForSelector(selector, { visible: true });
    // Clear input first
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type(selector, text);
  };

  try {
    // 1. Load Page and clear session
    console.log('1. Loading application at http://localhost:5174...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
    
    // Clear sessionStorage
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
      window.location.reload();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    
    console.log('   Storage cleared, showing login page.');

    // 2. Log in as Student Demo
    console.log('2. Logging in as student_demo@uptc.edu.co...');
    await waitAndType('input[name="correo"]', 'student_demo@uptc.edu.co');
    await waitAndType('input[name="password"]', 'password123');
    await waitAndClick('button[type="submit"]');
    
    // Wait for feed/dashboard to load
    await page.waitForSelector('.user-profile-sm', { visible: true });
    console.log('   Logged in successfully.');

    // 3. Verify Points
    const getPointsText = async () => {
      return await page.evaluate(() => {
        const el = document.querySelector('.user-profile-sm span');
        return el ? el.textContent : '';
      });
    };
    let pointsText = await getPointsText();
    console.log(`3. Verified sidebar points: "${pointsText}"`);
    if (!pointsText.includes('100')) {
      throw new Error(`Expected 100 points initially, got: ${pointsText}`);
    }

    // 4. Update Profile
    console.log('4. Navigating to Mi Perfil...');
    // Click on third .nav-item (Mi Perfil)
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-menu .nav-item'));
      const profileTab = items.find(el => el.textContent.includes('Mi Perfil'));
      if (profileTab) profileTab.click();
    });
    
    await page.waitForSelector('#profileNombre', { visible: true });
    
    console.log('   Editing profile fields...');
    await waitAndType('#profileNombre', 'Student Demo Edit');
    await waitAndType('#profileApodo', 'student_demo_edit');
    
    console.log('   Saving changes...');
    await page.click('.profile-container button[type="submit"]');
    
    // Wait for success message
    await page.waitForSelector('.profile-container .auth-success', { visible: true });
    const successMsg = await page.evaluate(() => document.querySelector('.profile-container .auth-success').textContent);
    console.log(`   Success message: "${successMsg}"`);
    
    // Verify sidebar updated name/apodo
    const sidebarName = await page.evaluate(() => document.querySelector('.user-profile-sm h4').textContent);
    console.log(`   Sidebar updated name: "${sidebarName}"`);
    if (!sidebarName.includes('Student Demo Edit')) {
      throw new Error(`Expected profile name update in sidebar, got: ${sidebarName}`);
    }

    // 5. Create a Post
    console.log('5. Navigating to Inicio...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-menu .nav-item'));
      const homeTab = items.find(el => el.textContent.includes('Inicio'));
      if (homeTab) homeTab.click();
    });
    
    await page.waitForSelector('input[placeholder="Título de la publicación..."]', { visible: true });
    
    console.log('   Selecting Career -> Subject -> Topic...');
    // Career dropdown
    await page.waitForSelector('.create-post-actions select:nth-of-type(1)', { visible: true });
    await page.select('.create-post-actions select:nth-of-type(1)', '1'); // Ingeniería de Sistemas
    
    // Wait a brief moment for cascading subject dropdown to populate
    await new Promise(r => setTimeout(r, 500));
    
    // Subject dropdown
    await page.waitForSelector('.create-post-actions select:nth-of-type(2)', { visible: true });
    await page.select('.create-post-actions select:nth-of-type(2)', '4'); // Bases de Datos
    
    // Wait a brief moment for cascading topic dropdown to populate
    await new Promise(r => setTimeout(r, 500));
    
    // Topic dropdown
    await page.waitForSelector('.create-post-actions select:nth-of-type(3)', { visible: true });
    // In our seed, Topic "SQL vs NoSQL" ID is "85e66a20-a513-4bfc-b8fb-d1d9a8375539"
    await page.select('.create-post-actions select:nth-of-type(3)', '85e66a20-a513-4bfc-b8fb-d1d9a8375539');
    
    // Verify protection checkbox is checked and disabled
    const checkboxStatus = await page.evaluate(() => {
      const input = document.querySelector('.create-post-actions input[type="checkbox"]');
      return input ? { checked: input.checked, disabled: input.disabled } : null;
    });
    console.log('   Protection checkbox status:', checkboxStatus);
    if (!checkboxStatus || !checkboxStatus.checked || !checkboxStatus.disabled) {
      throw new Error(`Expected post protection checkbox to be checked and disabled, got: ${JSON.stringify(checkboxStatus)}`);
    }

    console.log('   Entering title and content...');
    await waitAndType('input[placeholder="Título de la publicación..."]', 'Browser UI E2E Post');
    await waitAndType('textarea[placeholder*="¿Qué estás trabajando"]', 'Browser E2E Content: this is a secret database post');
    
    console.log('   Clicking Publicar Trabajo...');
    await page.click('button.btn-accent');
    
    // Wait for the new post to appear in feed
    await page.waitForFunction(() => {
      const cards = Array.from(document.querySelectorAll('.post-card'));
      return cards.some(c => c.textContent.includes('Browser UI E2E Post'));
    }, { timeout: 5000 });
    console.log('   Post created and visible in feed.');

    // 6. Log out
    console.log('6. Logging out student_demo...');
    // Click on profile menu tab
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-menu .nav-item'));
      const profileTab = items.find(el => el.textContent.includes('Mi Perfil'));
      if (profileTab) profileTab.click();
    });
    await page.waitForSelector('.profile-container button[style*="color"]', { visible: true }); // Cerrar Sesión button
    await page.click('.profile-container button[style*="color"]');
    
    // Wait for login view
    await page.waitForSelector('input[name="correo"]', { visible: true });
    console.log('   Logged out successfully.');

    // 7. Log in as David Rodriguez
    console.log('7. Logging in as david.rodriguez26@uptc.edu.co...');
    await waitAndType('input[name="correo"]', 'david.rodriguez26@uptc.edu.co');
    await waitAndType('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('.user-profile-sm', { visible: true });
    console.log('   Logged in successfully.');

    // 8. Verify David's points
    pointsText = await getPointsText();
    console.log(`8. David points: "${pointsText}"`);
    if (!pointsText.includes('500')) {
      throw new Error(`Expected David to have 500 points, got: ${pointsText}`);
    }

    // 9. Verify post is locked
    console.log('9. Verifying that the new post is locked for David...');
    const postStatus = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.post-card'));
      const targetCard = cards.find(c => c.textContent.includes('Browser UI E2E Post'));
      if (!targetCard) return { found: false };
      const isLocked = targetCard.textContent.includes('Este trabajo está protegido') || targetCard.querySelector('.ph-lock-key');
      const hasBlurredText = targetCard.textContent.includes('Lorem ipsum') || targetCard.querySelector('div[style*="blur"]');
      const hasRealContent = targetCard.textContent.includes('this is a secret database post');
      return { found: true, isLocked, hasBlurredText, hasRealContent };
    });
    console.log('   Post status for David:', postStatus);
    if (!postStatus.found) throw new Error('Could not find created post in feed.');
    if (!postStatus.isLocked) throw new Error('Post should be marked locked.');
    if (postStatus.hasRealContent) throw new Error('Real content should not be visible before unlock.');

    // 10. Unlock the post
    console.log('10. Unlocking the post...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.post-card'));
      const targetCard = cards.find(c => c.textContent.includes('Browser UI E2E Post'));
      if (targetCard) {
        const btn = targetCard.querySelector('button.btn-primary');
        if (btn) btn.click();
      }
    });
    
    // Wait for it to unlock
    await page.waitForFunction(() => {
      const cards = Array.from(document.querySelectorAll('.post-card'));
      const targetCard = cards.find(c => c.textContent.includes('Browser UI E2E Post'));
      return targetCard && targetCard.textContent.includes('this is a secret database post');
    }, { timeout: 5000 });
    console.log('    Post unlocked successfully and content is visible.');

    // Check David's updated points (should be 497)
    pointsText = await getPointsText();
    console.log(`    David updated points: "${pointsText}"`);
    if (!pointsText.includes('497')) {
      throw new Error(`Expected David to have 497 points after unlock, got: ${pointsText}`);
    }

    // 11. Like the post
    console.log('11. Liking the post...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.post-card'));
      const targetCard = cards.find(c => c.textContent.includes('Browser UI E2E Post'));
      if (targetCard) {
        const likeBtn = Array.from(targetCard.querySelectorAll('button.post-action'))
          .find(b => b.querySelector('.ph-heart'));
        if (likeBtn) likeBtn.click();
      }
    });
    
    // Wait for votes count to increase to 1
    await page.waitForFunction(() => {
      const cards = Array.from(document.querySelectorAll('.post-card'));
      const targetCard = cards.find(c => c.textContent.includes('Browser UI E2E Post'));
      if (targetCard) {
        const likeBtn = Array.from(targetCard.querySelectorAll('button.post-action'))
          .find(b => b.querySelector('.ph-heart'));
        return likeBtn && likeBtn.textContent.trim() === '1';
      }
      return false;
    }, { timeout: 3000 });
    console.log('    Post liked successfully. Likes count: 1.');

    // 12. Log out
    console.log('12. Logging out David...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-menu .nav-item'));
      const profileTab = items.find(el => el.textContent.includes('Mi Perfil'));
      if (profileTab) profileTab.click();
    });
    await page.waitForSelector('.profile-container button[style*="color"]', { visible: true });
    await page.click('.profile-container button[style*="color"]');
    await page.waitForSelector('input[name="correo"]', { visible: true });

    // 13. Log in as Student Demo and check points (+3 points reward for like)
    console.log('13. Logging in as student_demo again...');
    await waitAndType('input[name="correo"]', 'student_demo@uptc.edu.co');
    await waitAndType('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('.user-profile-sm', { visible: true });
    
    // Let's verify points
    pointsText = await getPointsText();
    console.log(`    Student Demo points (after receiving like): "${pointsText}"`);
    // Expected points: 100 original + 3 for the like = 103 points
    if (!pointsText.includes('103')) {
      throw new Error(`Expected Student Demo to have 103 points, got: ${pointsText}`);
    }

    // 14. Log out
    console.log('14. Logging out Student Demo...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-menu .nav-item'));
      const profileTab = items.find(el => el.textContent.includes('Mi Perfil'));
      if (profileTab) profileTab.click();
    });
    await page.waitForSelector('.profile-container button[style*="color"]', { visible: true });
    await page.click('.profile-container button[style*="color"]');
    await page.waitForSelector('input[name="correo"]', { visible: true });

    // 15. Log in as Admin
    console.log('15. Logging in as admin_demo@uptc.edu.co...');
    await waitAndType('input[name="correo"]', 'admin_demo@uptc.edu.co');
    await waitAndType('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.user-profile-sm', { visible: true });

    // 16. Hide the post
    console.log('16. Hiding the post as admin...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.post-card'));
      const targetCard = cards.find(c => c.textContent.includes('Browser UI E2E Post'));
      if (targetCard) {
        const btns = Array.from(targetCard.querySelectorAll('button'));
        const hideBtn = btns.find(b => b.textContent.includes('Ocultar'));
        if (hideBtn) hideBtn.click();
      }
    });

    // Wait for the post to display "Oculto" status
    await page.waitForFunction(() => {
      const cards = Array.from(document.querySelectorAll('.post-card'));
      const targetCard = cards.find(c => c.textContent.includes('Browser UI E2E Post'));
      return targetCard && targetCard.textContent.includes('Oculto');
    }, { timeout: 5000 });
    console.log('    Post is now hidden.');

    // 17. Log out Admin
    console.log('17. Logging out admin...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-menu .nav-item'));
      const profileTab = items.find(el => el.textContent.includes('Mi Perfil'));
      if (profileTab) profileTab.click();
    });
    await page.waitForSelector('.profile-container button[style*="color"]', { visible: true });
    await page.click('.profile-container button[style*="color"]');
    await page.waitForSelector('input[name="correo"]', { visible: true });

    // 18. Log in as David and check post visibility
    console.log('18. Logging in as David to verify hidden post...');
    await waitAndType('input[name="correo"]', 'david.rodriguez26@uptc.edu.co');
    await waitAndType('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.user-profile-sm', { visible: true });

    // Verify post is not in the feed
    console.log('    Checking post visibility in David\'s feed...');
    const postIsVisible = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.post-card'));
      return cards.some(c => c.textContent.includes('Browser UI E2E Post'));
    });
    console.log('    Is hidden post visible to student?:', postIsVisible);
    if (postIsVisible) {
      throw new Error('Post was hidden by admin but is still visible to standard student feed.');
    }
    console.log('    Verified: Hidden post does not appear in standard student feed.');

    console.log('\n🎉 E2E UI BROWSER TESTS SUCCEEDED PERFECTLY! 🎉\n');

  } catch (err) {
    console.error('\n❌ E2E UI TEST FAILED:', err.message);
    // Take screenshot on failure for debugging
    await page.screenshot({ path: 'qa/failure-screenshot.png' });
    console.log('   Saved failure screenshot to qa/failure-screenshot.png');
    await browser.close();
    process.exit(1);
  }

  await browser.close();
  process.exit(0);
})();
