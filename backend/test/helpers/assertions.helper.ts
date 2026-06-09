export function expectMessageContaining(
  body: Record<string, unknown>,
  expected: string,
) {
  const message = body.message;
  const messages = Array.isArray(message) ? message.join("\n") : String(message);

  expect(messages).toContain(expected);
}
