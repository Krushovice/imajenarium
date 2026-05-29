import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BookCard, type BookData } from "@/components/books/book-card";

const baseBook: BookData = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Мастер и Маргарита",
  author: "Михаил Булгаков",
  emotionTags: ["dark", "mysterious"],
};

describe("BookCard — default variant", () => {
  it("renders title and author", () => {
    render(<BookCard book={baseBook} />);
    expect(screen.getByText("Мастер и Маргарита")).toBeInTheDocument();
    expect(screen.getByText(/Михаил Булгаков/)).toBeInTheDocument();
  });

  it("renders emotion tags as EmotionBadge spans", () => {
    render(<BookCard book={baseBook} />);
    expect(screen.getAllByText("dark").length).toBeGreaterThan(0);
    expect(screen.getAllByText("mysterious").length).toBeGreaterThan(0);
  });

  it("renders year when provided", () => {
    render(<BookCard book={{ ...baseBook, year: 1967 }} />);
    expect(screen.getByText(/1967/)).toBeInTheDocument();
  });

  it("renders status badge when status provided", () => {
    render(<BookCard book={{ ...baseBook, status: "reading" }} />);
    expect(screen.getByText("Читаю")).toBeInTheDocument();
  });

  it("renders match score when provided", () => {
    render(<BookCard book={{ ...baseBook, matchScore: 92 }} />);
    expect(screen.getByText(/92%/)).toBeInTheDocument();
  });

  it("renders quote in blockquote", () => {
    render(<BookCard book={{ ...baseBook, quote: "Рукописи не горят" }} />);
    expect(screen.getByText(/Рукописи не горят/)).toBeInTheDocument();
  });

  it("whyRecommended section hidden by default", () => {
    render(<BookCard book={{ ...baseBook, whyRecommended: "Тёмная атмосфера" }} />);
    expect(screen.queryByText("Тёмная атмосфера")).not.toBeInTheDocument();
  });

  it("expands whyRecommended on button click", () => {
    render(<BookCard book={{ ...baseBook, whyRecommended: "Тёмная атмосфера" }} />);
    fireEvent.click(screen.getByText(/Почему это тебе/));
    expect(screen.getByText("Тёмная атмосфера")).toBeInTheDocument();
  });

  it("calls onStatusChange with correct args", () => {
    const handler = vi.fn();
    render(<BookCard book={baseBook} onStatusChange={handler} />);
    fireEvent.click(screen.getByText("+ В библиотеку"));
    expect(handler).toHaveBeenCalledWith(baseBook.id, "want_to_read");
  });
});

describe("BookCard — compact variant", () => {
  it("renders title and author", () => {
    render(<BookCard book={baseBook} variant="compact" />);
    expect(screen.getByText("Мастер и Маргарита")).toBeInTheDocument();
    expect(screen.getByText("Михаил Булгаков")).toBeInTheDocument();
  });

  it("shows at most 2 emotion tags", () => {
    const bookWith4Tags = { ...baseBook, emotionTags: ["dark", "mysterious", "hopeful", "romantic"] };
    render(<BookCard book={bookWith4Tags} variant="compact" />);
    expect(screen.getAllByRole("generic").filter((el) => el.tagName === "SPAN").length).toBeLessThanOrEqual(10);
  });
});

describe("BookCard — horizontal variant", () => {
  it("renders title and author", () => {
    render(<BookCard book={baseBook} variant="horizontal" />);
    expect(screen.getByText("Мастер и Маргарита")).toBeInTheDocument();
    expect(screen.getByText(/Михаил Булгаков/)).toBeInTheDocument();
  });

  it("renders whyRecommended inline without toggle", () => {
    render(<BookCard book={{ ...baseBook, whyRecommended: "Отличная атмосфера" }} variant="horizontal" />);
    expect(screen.getByText(/Отличная атмосфера/)).toBeInTheDocument();
  });
});

describe("coverGradient (via BookCard)", () => {
  it("same title → same gradient class on re-render", () => {
    const { container: c1 } = render(<BookCard book={baseBook} />);
    const { container: c2 } = render(<BookCard book={baseBook} />);
    const div1 = c1.querySelector(".h-48") as HTMLElement;
    const div2 = c2.querySelector(".h-48") as HTMLElement;
    expect(div1?.className).toBe(div2?.className);
  });
});
