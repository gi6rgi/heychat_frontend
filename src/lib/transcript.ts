/**
 * Clean a live transcript line down to the spoken words.
 *
 * The voice model slips roleplay stage directions in *asterisks* into its
 * transcript despite the prompt rule ("Издалека. *smiles and turns the
 * page*") — they are never spoken aloud, so the subtitle drops them, along
 * with an unterminated "*glances…" chunk still streaming in and ASR markup
 * artifacts like "<noise>". The backend strips the same noise before
 * persisting; this handles the live stream.
 */
export function cleanTranscript(text: string): string {
  return text
    .replace(/\*[^*\n]*(?:\*|$)/g, " ") // *stage directions*, incl. unterminated
    .replace(/<[^>\n]{1,30}>/g, " ") // ASR artifacts like <noise>
    .replace(/\s{2,}/g, " ")
    .trim();
}
