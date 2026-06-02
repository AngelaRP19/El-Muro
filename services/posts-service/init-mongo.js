db = db.getSiblingDB("posts");
db.createCollection("posts");

db.createUser(
        {
            user: "root",
            pwd: "Password123",
            roles: [
                {
                    role: "readWrite",
                    db: "posts"
                }
            ]
        }
);