export const ExportButton = ({ format }: { format: 'pdf' | 'csv' }) => (
  <button className="btn btn-neon mt-2 mr-2">Export {format.toUpperCase()}</button>
);