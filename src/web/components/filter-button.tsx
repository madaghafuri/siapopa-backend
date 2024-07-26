export const FilterButton = ({ ...props }: Partial<HTMLButtonElement>) => {
  return (
    //@ts-ignore
    <button
      {...props}
      class="rounded bg-primary px-2 py-1 text-white"
      hx-indicator="#loading"
      type="submit"
    >
      <div id="loading">
        <p>Filter</p>
        <i class="fa-solid fa-spinner"></i>
      </div>
    </button>
  );
};
