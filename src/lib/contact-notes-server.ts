import { contactNotes } from "@/db/site/schema";

/** Selects a `contact_notes` row in the snake_case `ContactNote` wire shape. */
export const noteColumns = {
  id: contactNotes.id,
  contact_id: contactNotes.contactId,
  happened_on: contactNotes.happenedOn,
  channel: contactNotes.channel,
  body: contactNotes.body,
  created_at: contactNotes.createdAt,
  updated_at: contactNotes.updatedAt,
};
