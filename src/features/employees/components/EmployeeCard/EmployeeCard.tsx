import type { EmployeeCardProps } from "./EmployeeCard.types";

export default function EmployeeCard({
  employee,
  onDelete,
  onEdit,
}: EmployeeCardProps) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">
          {employee.firstName} {employee.lastName}
        </h2>

        <p>Email: {employee.email}</p>

        <p>Position: {employee.position}</p>

        <p>Salary: ${employee.salary}</p>

        <div className="card-actions justify-end">
          <button
            className="btn btn-warning btn-sm"
            onClick={() => onEdit(employee)}
          >
            Edit
          </button>

          <button
            className="btn btn-error btn-sm"
            onClick={() => onDelete(employee.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
