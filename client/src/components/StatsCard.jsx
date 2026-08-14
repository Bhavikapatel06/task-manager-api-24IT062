import React from 'react';
import { CheckSquare, Clock, AlertCircle, ListTodo } from 'lucide-react';

export default function StatsCard({ tasks = [] }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const highPriority = tasks.filter((t) => t.priority === 'high' && !t.completed).length;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon-wrapper total">
          <ListTodo size={18} />
        </div>
        <div>
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper pending">
          <Clock size={18} />
        </div>
        <div>
          <div className="stat-value">{pending}</div>
          <div className="stat-label">In Progress</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper completed">
          <CheckSquare size={18} />
        </div>
        <div>
          <div className="stat-value">{completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper high">
          <AlertCircle size={18} />
        </div>
        <div>
          <div className="stat-value">{highPriority}</div>
          <div className="stat-label">Urgent (High)</div>
        </div>
      </div>
    </div>
  );
}
