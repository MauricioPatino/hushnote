export type Note = {
    id: string;
    created_at: string;
    text: string;
    audio_path: string | null;
    tags: string[] | null;
  };