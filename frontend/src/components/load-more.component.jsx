const LoadMoreDataBtn = ({ handleLoadMore }) => {
    return (
        <button 
            onClick={handleLoadMore}
            className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
        >
            Load More
        </button>
    );
};

export default LoadMoreDataBtn;