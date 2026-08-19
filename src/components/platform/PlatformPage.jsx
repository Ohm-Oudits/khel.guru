const PlatformPage = ({ children, className = "" }) => {
  return (
    <div className={`px-4 pb-24 pt-6 md:px-6 xl:px-8 ${className}`.trim()}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {children}
      </div>
    </div>
  );
};

export default PlatformPage;
