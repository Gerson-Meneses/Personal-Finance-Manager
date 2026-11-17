import { Tag } from "../entities/Tag.entity";
import { TagResponse } from "../ResponseInterfaces/TagResponse";

export interface TagMapperProps {
    usageCount?: number;
}

export const toTagResponse = (tag: Tag, { usageCount }: TagMapperProps = {}): TagResponse => {
    const response: TagResponse = {
        id: tag.id,
        name: tag.name,
        color: tag.color,
    };

    if (usageCount !== undefined) response.usageCount = usageCount;
    if (tag.createdAt) response.createdAt = tag.createdAt;
    if (tag.updatedAt) response.updatedAt = tag.updatedAt;

    return response;
};
