declare module "markdown-it-task-lists" {
  const taskLists: (
    md: unknown,
    options?: { enabled?: boolean; label?: boolean; labelAfter?: boolean }
  ) => void;
  export default taskLists;
}
