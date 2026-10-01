interface PageDotsProps {
  count: number;
  current: number;
  onSelect: (page: number) => void;
}

export function PageDots({ count, current, onSelect }: PageDotsProps) {
  return (
    <div className="flex justify-center">
      <div className="flex flex-wrap justify-center rounded-full bg-black/15 px-1.5 backdrop-blur-sm">
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`Page ${index + 1}`}
            aria-current={index === current ? "page" : undefined}
            className="grid h-6 w-[1.125rem] place-items-center rounded-full focus-visible:outline-white"
          >
            <span
              className={`size-[0.4375rem] rounded-full transition-colors duration-150 ${index === current ? "bg-white" : "bg-white/40"}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
