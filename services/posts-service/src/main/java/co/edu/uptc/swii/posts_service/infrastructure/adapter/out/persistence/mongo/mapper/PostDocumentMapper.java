package co.edu.uptc.swii.posts_service.infrastructure.adapter.out.persistence.mongo.mapper;

import co.edu.uptc.swii.posts_service.domain.model.PostAggregate;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.out.persistence.mongo.document.PostDocument;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PostDocumentMapper {

    public PostDocument toDocument(PostAggregate aggregate) {
        PostDocument doc = new PostDocument();
        doc.setId(aggregate.getId());
        doc.setTitle(aggregate.getTitle());
        doc.setDescription(aggregate.getDescription());
        doc.setFileUrl(aggregate.getFileUrl());
        doc.setTextContent(aggregate.getTextContent());
        doc.setVotes(aggregate.getVotes());
        doc.setAccessPoints(aggregate.getAccessPoints());
        doc.setBlocked(aggregate.getBlocked());
        doc.setHidden(aggregate.getHidden());
        doc.setCreatedAt(aggregate.getCreatedAt());
        doc.setAuthorId(aggregate.getAuthorId());
        doc.setTopicId(aggregate.getTopicId());
        doc.setUnlockedByUsers(aggregate.getUnlockedByUsers());
        doc.setVotedByUsers(aggregate.getVotedByUsers());
        doc.setRewardedVotes(aggregate.getRewardedVotes());
        if (aggregate.getComments() != null) {
            doc.setComments(aggregate.getComments().stream()
                .map(c -> new PostDocument.Comment(c.getId(), c.getText(), c.getAuthorId(), c.getAuthorName(), c.getCreatedAt()))
                .collect(Collectors.toList()));
        }
        return doc;
    }

    public PostAggregate toAggregate(PostDocument document) {
        PostAggregate agg = new PostAggregate();
        agg.setId(document.getId());
        agg.setTitle(document.getTitle());
        agg.setDescription(document.getDescription());
        agg.setFileUrl(document.getFileUrl());
        agg.setTextContent(document.getTextContent());
        agg.setVotes(document.getVotes());
        agg.setAccessPoints(document.getAccessPoints());
        agg.setBlocked(document.getBlocked());
        agg.setHidden(document.getHidden());
        agg.setCreatedAt(document.getCreatedAt());
        agg.setAuthorId(document.getAuthorId());
        agg.setTopicId(document.getTopicId());
        agg.setUnlockedByUsers(document.getUnlockedByUsers());
        agg.setVotedByUsers(document.getVotedByUsers());
        agg.setRewardedVotes(document.getRewardedVotes());
        if (document.getComments() != null) {
            agg.setComments(document.getComments().stream()
                .map(c -> new PostAggregate.Comment(c.getId(), c.getText(), c.getAuthorId(), c.getAuthorName(), c.getCreatedAt()))
                .collect(Collectors.toList()));
        }
        return agg;
    }
}