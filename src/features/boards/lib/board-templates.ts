export type TemplateColumn = {
  title: string;
  order: number;
  wipLimit?: number;
  isCompletion?: boolean;
};

export type BoardTemplate = {
  id: string;
  columns: TemplateColumn[];
};

// Column definitions for each built-in template.
export const BOARD_TEMPLATES: BoardTemplate[] = [
  { id: "blank", columns: [] },
  {
    id: "kanban",
    columns: [
      { title: "To Do", order: 1 },
      { title: "In Progress", order: 2, wipLimit: 3 },
      { title: "Done", order: 3, isCompletion: true },
    ],
  },
  {
    id: "scrum",
    columns: [
      { title: "Backlog", order: 1 },
      { title: "Sprint", order: 2 },
      { title: "In Progress", order: 3, wipLimit: 3 },
      { title: "Review", order: 4 },
      { title: "Done", order: 5, isCompletion: true },
    ],
  },
  {
    id: "personal",
    columns: [
      { title: "Ideas", order: 1 },
      { title: "This Week", order: 2 },
      { title: "Today", order: 3, wipLimit: 5 },
      { title: "Done", order: 4, isCompletion: true },
    ],
  },
];
