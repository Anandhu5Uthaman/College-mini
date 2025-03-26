const NoDataMessage = ({ message }) => {
    return (
        <div className="text-center w-full p-4 rounded-lg bg-grey/50 mt-4">
            <p className="text-dark-grey">{message || 'No data available'}</p>
        </div>
    );
};

export default NoDataMessage;