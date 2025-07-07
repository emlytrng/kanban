"use client";

import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";

import { useColumns, useKanbanActions } from "@/lib/store";

import KanbanColumn from "../kanban-column";

export default function BoardContent() {
  const columns = useColumns();
  const { moveCard, moveColumn } = useKanbanActions();

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    if (type === "column") {
      moveColumn(source.index, destination.index);
      return;
    }

    moveCard(
      draggableId,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index
    );
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden bg-background">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="column" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-6 p-6 h-full kanban-scrollbar"
              style={{ minWidth: "max-content" }}
            >
              {columns.map((column, index) => (
                <KanbanColumn key={column.id} column={column} index={index} />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
