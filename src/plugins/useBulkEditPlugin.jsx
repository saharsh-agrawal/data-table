import { useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";

function buildInitialFieldStates(fields) {
	return fields.reduce((acc, field) => {
		acc[field.key] = {
			checked: field.defaultChecked ?? false,
			value: field.defaultValue ?? "",
		};
		return acc;
	}, {});
}

function formatBulkValue(value) {
	if (value === "") {
		return "(empty)";
	}

	if (Array.isArray(value)) {
		return value.join(", ");
	}

	return String(value);
}

export default function useBulkEditPlugin({
	enabled,
	id,
	fields,
	getRowKey,
	title,
	selectionLabel,
	actionLabel,
	submitLabel,
	endpoint,
	callBackend,
	navigate,
	onSuccess,
	buildRequestData,
}) {
	const emptyFieldStates = buildInitialFieldStates(fields);
	const [selectedKeys, setSelectedKeys] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [fieldStates, setFieldStates] = useState(emptyFieldStates);
	const [loading, setLoading] = useState(false);

	const clearSelection = () => {
		setSelectedKeys([]);
	};

	const resetForm = () => {
		setFieldStates(emptyFieldStates);
	};

	const closeModal = () => {
		setShowModal(false);
		resetForm();
	};

	const isSelected = (row) => selectedKeys.includes(String(getRowKey(row)));

	const toggleRow = (row) => {
		const key = String(getRowKey(row));
		setSelectedKeys((current) =>
			current.includes(key)
				? current.filter((value) => value !== key)
				: [...current, key],
		);
	};

	const togglePage = (rows) => {
		const rowKeys = rows.map((row) => String(getRowKey(row)));
		const allSelected = rowKeys.every((key) => selectedKeys.includes(key));

		setSelectedKeys((current) => {
			if (allSelected) {
				return current.filter((key) => !rowKeys.includes(key));
			}

			const next = [...current];
			rowKeys.forEach((key) => {
				if (!next.includes(key)) {
					next.push(key);
				}
			});
			return next;
		});
	};

	const submit = () => {
		const updates = fields.reduce((acc, field) => {
			if (fieldStates[field.key]?.checked) {
				acc[field.key] = fieldStates[field.key]?.value ?? "";
			}
			return acc;
		}, {});
		const selectedFields = fields.filter(
			(field) => fieldStates[field.key]?.checked,
		);

		if (selectedKeys.length === 0) {
			alert(`Please select at least one ${selectionLabel}.`);
			return;
		}

		if (Object.keys(updates).length === 0) {
			alert(`Please check at least one field to ${actionLabel}.`);
			return;
		}

		const fieldSummary = selectedFields
			.map(
				(field) =>
					`${field.label}: ${formatBulkValue(updates[field.key])}`,
			)
			.join("\n");
		const confirmationMessage =
			`Are you sure you want to update ${selectedFields.length} field${
				selectedFields.length === 1 ? "" : "s"
			} for ${selectedKeys.length} selected ${selectionLabel}?` +
			(selectedFields.length > 0 ? `\n\n${fieldSummary}` : "");

		if (!window.confirm(confirmationMessage)) {
			return;
		}

		callBackend({
			endpoint,
			data: buildRequestData({ selectedKeys, updates, fieldStates }),
			setLoading,
			onSuccess: (response) => {
				closeModal();
				clearSelection();
				onSuccess && onSuccess(response);
			},
			navigate,
		});
	};

	if (!enabled) {
		return { id };
	}

	return {
		id,
		selection: {
			isSelected,
			toggleRow,
			togglePage,
		},
		renderToolbar: () => (
			<div
				style={{
					marginBottom: "20px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					flexWrap: "wrap",
					gap: "10px",
				}}
			>
				<div>
					Selected {selectionLabel}: {selectedKeys.length}
				</div>
				<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
					<Button
						variant="primary"
						disabled={selectedKeys.length === 0}
						onClick={() => setShowModal(true)}
					>
						{actionLabel} selected
					</Button>
					<Button
						variant="secondary"
						disabled={selectedKeys.length === 0}
						onClick={clearSelection}
					>
						Clear selection
					</Button>
				</div>
			</div>
		),
		renderOverlay: () => (
			<Modal show={showModal} onHide={closeModal} size="lg" centered scrollable>
				<Modal.Header closeButton>
					<Modal.Title>{title}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p className="text-muted">
						Check the fields you want to overwrite. Checked fields can
						be updated to empty values if needed.
					</p>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "12px",
						}}
					>
						{fields.map((field) => (
							<div
								key={field.key}
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "6px",
									padding: "8px 0",
									borderBottom: "1px solid rgba(0,0,0,0.08)",
								}}
							>
								<Form.Check
									type="checkbox"
									label={field.label}
									checked={fieldStates[field.key]?.checked ?? false}
									onChange={(e) => {
										setFieldStates({
											...fieldStates,
											[field.key]: {
												...fieldStates[field.key],
												checked: e.target.checked,
											},
										});
									}}
								/>
								{field.renderInput ? (
									field.renderInput({
										value: fieldStates[field.key]?.value ?? "",
										onChange: (nextValue) => {
											setFieldStates({
												...fieldStates,
												[field.key]: {
													...fieldStates[field.key],
													value: nextValue,
												},
											});
										},
									})
								) : field.options ? (
									<Form.Select
										size="sm"
										value={fieldStates[field.key]?.value ?? ""}
										onChange={(e) => {
											setFieldStates({
												...fieldStates,
												[field.key]: {
													...fieldStates[field.key],
													value: e.target.value,
												},
											});
										}}
									>
										{field.options.map((option) => (
											<option
												key={option.value}
												value={option.value}
											>
												{option.label}
											</option>
										))}
									</Form.Select>
								) : (
									<Form.Control
										size="sm"
										type={field.type || "text"}
										value={fieldStates[field.key]?.value ?? ""}
										onChange={(e) => {
											setFieldStates({
												...fieldStates,
												[field.key]: {
													...fieldStates[field.key],
													value: e.target.value,
												},
											});
										}}
									/>
								)}
							</div>
						))}
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={closeModal}>
						Cancel
					</Button>
					<Button variant="primary" onClick={submit}>
						{loading ? (
							<Spinner animation="border" size="sm" />
						) : (
							submitLabel
						)}
					</Button>
				</Modal.Footer>
			</Modal>
		),
		clearSelection,
		selectedCount: selectedKeys.length,
	};
}
