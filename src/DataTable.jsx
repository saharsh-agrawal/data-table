import React, { useEffect } from "react";
import {
	Table,
	Pagination,
	Placeholder,
	Card,
	Button,
	Form,
} from "react-bootstrap";

export default function DataTable(props) {
	const {
		data,
		columnHeaders,
		extraColumns,
		count,
		tableControls: { page, length, sortField, sortDir, showColumns },
		setTableControls,
		resetTableControls,
		specialRenderConfig,
		plugins = [],
	} = props;

	// Check if bulk edit plugin is present in the plugins array
	const selectionPlugin = plugins.find((plugin) => plugin.selection);
	const hasSelection = !!selectionPlugin;

	useEffect(() => {
		$(".selectpicker").selectpicker();
	}, [data]);

	const controls = (
		<div
			style={{
				display: "flex",
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "center",
				flexWrap: "wrap",
			}}
		>
			<div>
				Show Columns:
				<br />
				<select
					className="selectpicker"
					multiple
					data-live-search="true"
					value={showColumns}
					onChange={(e) => {
						const selectedOptions = Array.from(
							e.target.selectedOptions,
						).map((option) => option.value);
						setTableControls({
							...props.tableControls,
							showColumns: selectedOptions,
						});
					}}
				>
					{columnHeaders.map((header) => (
						<option value={header.key} key={header.key}>
							{header.label}
						</option>
					))}
					{extraColumns.map((header) => (
						<option value={header.key} key={header.key}>
							{header.label}
						</option>
					))}
				</select>
			</div>
			<Button variant="primary">Total : {count}</Button>
			<div>
				Page :
				<Pagination>
					{page > 2 && (
						<Pagination.Item
							onClick={() => {
								setTableControls({
									...props.tableControls,
									page: 1,
								});
							}}
						>
							{1}
						</Pagination.Item>
					)}
					{page > 3 && <Pagination.Ellipsis />}
					{page > 1 && (
						<Pagination.Item
							onClick={() => {
								setTableControls({
									...props.tableControls,
									page: page - 1,
								});
							}}
						>
							{page - 1}
						</Pagination.Item>
					)}
					<Pagination.Item active>{page}</Pagination.Item>
					{page < Math.ceil(count / length) && (
						<Pagination.Item
							onClick={() => {
								setTableControls({
									...props.tableControls,
									page: page + 1,
								});
							}}
						>
							{page + 1}
						</Pagination.Item>
					)}
					{page < Math.ceil(count / length) - 2 && (
						<Pagination.Ellipsis />
					)}
					{page < Math.ceil(count / length) - 1 && (
						<Pagination.Item
							onClick={() => {
								setTableControls({
									...props.tableControls,
									page: Math.ceil(count / length),
								});
							}}
						>
							{Math.ceil(count / length)}
						</Pagination.Item>
					)}
				</Pagination>
			</div>
			<div>
				Show rows per page:
				<Pagination>
					{Array(10, 20, 50, 100).map((val) => (
						<Pagination.Item
							key={val}
							active={length == val}
							onClick={() => {
								setTableControls({
									...props.tableControls,
									length: val,
									page: 1,
								});
							}}
						>
							{val}
						</Pagination.Item>
					))}
				</Pagination>
			</div>
			<Button
				variant={"primary"}
				className="ms-2"
				onClick={resetTableControls}
				title="Reset Table Preferences"
			>
				Reset Table
			</Button>
		</div>
	);

	return (
		<>
			{plugins.map((plugin, index) =>
				plugin.renderToolbar ? (
					<div key={plugin.id || index}>{plugin.renderToolbar()}</div>
				) : null,
			)}
			{controls}
			<Table striped hover responsive>
				<thead>
					<tr>
						{hasSelection && (
							<th style={{ width: "1%" }}>
								<Form.Check
									type="checkbox"
									checked={
										data.length > 0 &&
										data.every((row) =>
											selectionPlugin.selection.isSelected(
												row,
											),
										)
									}
									onChange={() => {
										selectionPlugin.selection.togglePage(
											data,
										);
									}}
								/>
							</th>
						)}
						{columnHeaders
							.filter((header) =>
								showColumns.includes(header.key),
							)
							.map((header, index) => {
								return (
									<th
										key={index}
										onClick={() => {
											if (sortField == header.key) {
												setTableControls({
													...props.tableControls,
													sortDir: -sortDir,
												});
											} else {
												setTableControls({
													...props.tableControls,
													page: 1,
													sortField: header.key,
													sortDir: 1,
												});
											}
										}}
										style={{
											cursor: "pointer",
										}}
									>
										{header.label + " "}
										{
											/* Copy all entries button */
											(header.key === "Email" ||
												header.key ===
													"PhoneNumber") && (
												<i
													className="fas fa-copy"
													onClick={(e) => {
														e.stopPropagation();
														const list = data.map(
															(row) =>
																row[header.key],
														);
														navigator.clipboard.writeText(
															list.join("\n"),
														);
														// change icon to checkmark
														e.target.className =
															"fas fa-check";
														setTimeout(() => {
															e.target.className =
																"fas fa-copy";
														}, 2000);
													}}
												/>
											)
										}{" "}
										{sortField == header.key &&
											(sortDir > 0 ? (
												<i
													className="fa fa-caret-up"
													aria-hidden="true"
												></i>
											) : (
												<i
													className="fa fa-caret-down"
													aria-hidden="true"
												></i>
											))}
									</th>
								);
							})}
						{extraColumns
							.filter((header) =>
								showColumns.includes(header.key),
							)
							.map((header, index) => {
								return <th key={index}>{header.label}</th>;
							})}
					</tr>
				</thead>
				<tbody>
					{data.map((row, idx) => (
						<tr key={idx}>
							{hasSelection && (
								<td>
									<Form.Check
										type="checkbox"
										checked={selectionPlugin.selection.isSelected(
											row,
										)}
										onChange={() => {
											selectionPlugin.selection.toggleRow(
												row,
											);
										}}
									/>
								</td>
							)}
							{columnHeaders
								.filter((header) =>
									showColumns.includes(header.key),
								)
								.map((header, index) => (
									<td key={index}>
										{header.key in row ? (
											specialRenderConfig &&
											header.key in
												specialRenderConfig ? (
												specialRenderConfig[header.key](
													row,
												)
											) : header.key === "Email" ? (
												<>
													<a
														href={
															"mailto:" +
															row[header.key]
														}
													>
														{row[header.key]}
													</a>
													&nbsp;
													<i
														className="fas fa-copy"
														onClick={(e) => {
															e.stopPropagation();
															navigator.clipboard.writeText(
																row[header.key],
															);
															// change icon to checkmark
															e.target.className =
																"fas fa-check";
															setTimeout(() => {
																e.target.className =
																	"fas fa-copy";
															}, 2000);
														}}
													/>
												</>
											) : header.key === "PhoneNumber" ? (
												<>
													<a
														href={
															"tel:" +
															row[header.key]
														}
													>
														{row[header.key]}
													</a>
													&nbsp;
													<i
														className="fas fa-copy"
														onClick={(e) => {
															e.stopPropagation();
															navigator.clipboard.writeText(
																row[header.key],
															);
															// change icon to checkmark
															e.target.className =
																"fas fa-check";
															setTimeout(() => {
																e.target.className =
																	"fas fa-copy";
															}, 2000);
														}}
													/>
													<a
														href={
															"https://api.whatsapp.com/send?phone=" +
															row[
																header.key
															].replace(
																/[^0-9]/g,
																"",
															)
														}
														target="_blank"
													>
														<img
															src="https://spellingbeeinternational.com/img/whatsapp-messenger-android.png"
															height={20}
														/>
													</a>
												</>
											) : (
												row[header.key]
											)
										) : (
											<Placeholder
												as={Card.Text}
												animation="glow"
											>
												<Placeholder xs={6} />
											</Placeholder>
										)}
									</td>
								))}
							{extraColumns
								.filter((header) =>
									showColumns.includes(header.key),
								)
								.map((header, index) => {
									return (
										<td key={index}>
											{header.render(row)}
										</td>
									);
								})}
						</tr>
					))}
				</tbody>
			</Table>
			{plugins.map((plugin, index) =>
				plugin.renderOverlay ? (
					<div key={plugin.id || index}>{plugin.renderOverlay()}</div>
				) : null,
			)}
			{controls}
		</>
	);
}
