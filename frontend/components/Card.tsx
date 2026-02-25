import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = "" }: CardProps) => (
  <div className={`glass rounded-lg shadow-lg p-4 ${className}`}>{children}</div>
);

