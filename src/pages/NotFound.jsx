import React from 'react';
import { Btn, Card, EmptyState } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <div className="page">
      <Card pad={false}>
        <EmptyState icon="search" title="Page not found" desc="The page you are looking for doesn’t exist or has moved." action={<Btn to="/dashboard">Go to Dashboard</Btn>} />
      </Card>
    </div>
  );
}
