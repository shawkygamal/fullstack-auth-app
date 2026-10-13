/** The error body every API error answers with. */
export interface ApiErrorResponse {
  statusCode: number;
  name: string;
  messages: string[];
}
