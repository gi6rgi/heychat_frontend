/**
 * Split a live transcript line into the spoken text and its stage direction.
 *
 * The voice model adds theatre-style remarks in *asterisks* to its transcript
 * ("Издалека. *smiles politely and turns the page*") — they are never spoken
 * aloud, so the subtitle shows them as a separate faint remark line instead
 * of inside the spoken line. Mid-stream an unterminated "*glances…" chunk is
 * hidden from the spoken text until it closes. ASR markup ("<noise>") is
 * dropped entirely.
 */
export interface SubtitleParts {
  spoken: string;
  direction: string | null;
}

export function splitTranscript(text: string): SubtitleParts {
  const directions: string[] = [];
  let spoken = text.replace(/\*([^*]+)\*/g, (_, d: string) => {
    const trimmed = d.trim();
    if (trimmed) directions.push(trimmed);
    return " ";
  });
  spoken = spoken
    .replace(/\*[^*]*$/, " ") // unterminated direction still streaming in
    .replace(/<[^>\n]{1,30}>/g, " ") // ASR artifacts like <noise>
    .replace(/\s{2,}/g, " ")
    .trim();
  return {
    spoken,
    direction: directions.length ? directions[directions.length - 1] : null,
  };
}
