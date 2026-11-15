import { Context } from "hono";
import { UuidSchema } from "../schemas/uuid.schema";
import type { CreateContactOutput, MergeContactsOutput, UpdateContactOutput } from "../schemas/contact.schema";
import { ContactService } from "../services/contactService";

const contactService = new ContactService();

export const listContacts = async (c: Context, userId: UuidSchema) => {
    return c.json(await contactService.list(userId), 200);
};

export const createContact = async (c: Context, userId: UuidSchema, data: CreateContactOutput) => {
    return c.json(await contactService.create(userId, data.name, data.notes), 201);
};

export const updateContact = async (
    c: Context,
    userId: UuidSchema,
    contactId: UuidSchema,
    data: UpdateContactOutput
) => {
    return c.json(await contactService.update(userId, contactId, data), 200);
};

export const mergeContacts = async (
    c: Context,
    userId: UuidSchema,
    contactId: UuidSchema,
    data: MergeContactsOutput
) => {
    return c.json(await contactService.merge(userId, contactId, data.targetContactId as UuidSchema), 200);
};
