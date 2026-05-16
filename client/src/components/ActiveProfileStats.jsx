import { useEffect, useState } from "react";
import { getActiveProfileCountByGender } from "../logic/profiles.logic";

export default function ActiveProfileStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getActiveProfileCountByGender().then(setStats);
  }, []);

  if (!stats) return null;

  return (
    <div className="dashboard-card">
      <h3>No. of Active Profiles</h3>

      <div className="stat-row">
        <span>Male: </span>
        <strong>{stats.male}</strong>
      </div>

      <div className="stat-row">
        <span>Female: </span>
        <strong>{stats.female}</strong>
      </div>
    </div>
  );
}
