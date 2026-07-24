import { CursorProvider } from "@/components/cursor/CursorProvider";
import { StoryPrototype } from "@/components/story/StoryPrototype";

export default function Home() {
  return (
    <CursorProvider>
      <StoryPrototype />
    </CursorProvider>
  );
}
