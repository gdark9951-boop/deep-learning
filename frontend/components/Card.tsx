import React from "react";
export const Card = ({ children, className = "" }) => (
  <div className={`glass rounded-lg shadow-lg p-4 ${className}`}>{children}</div>
);
