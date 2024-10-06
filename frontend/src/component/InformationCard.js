import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './InformationCard.css';

const ITEMS_PER_PAGE = 5; // Number of lines/items to show per page

export default function InformationCard({ info }) {
  const [currentPage, setCurrentPage] = useState(0);

  // Split the content into separate lines based on new lines for pagination
  const lines = info.split('\n').filter(line => line.trim() !== ''); // Filter out empty lines
  const totalPages = Math.ceil(lines.length / ITEMS_PER_PAGE);

  // Get the content for the current page
  const currentContent = lines
    .slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)
    .join('\n');

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="information-card">
      <h2>Information Title</h2>
  
      {/* Render the current content using ReactMarkdown */}
      <ReactMarkdown>{currentContent}</ReactMarkdown>
  
      {/* Pagination Controls */}
      <div className="pagination-controls">
        {/* Only show the Previous button if it's not the first page */}
        {currentPage > 0 && (
          <button onClick={handlePreviousPage}>
            &#60;
          </button>
        )}
  
        <span>
          Page {currentPage + 1} of {totalPages}
        </span>
  
        {/* Only show the Next button if it's not the last page */}
        {currentPage < totalPages - 1 && (
          <button onClick={handleNextPage}>
            {">"}
          </button>
        )}
      </div>
    </div>
  );
  
}
