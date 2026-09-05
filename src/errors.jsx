/*

	Lilact
	Copyright (C) 2024-2026 Arash Kazemi <contact.arash.kazemi@gmail.com>
	All rights reserved.

	BSD-2-Clause

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met:

	* Redistributions of source code must retain the above copyright
		notice, this list of conditions and the following disclaimer.
	* Redistributions in binary form must reproduce the above copyright
		notice, this list of conditions and the following disclaimer in the
		documentation and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
	THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/
/*
Lilact
Copyright (C) 2024-2026 Arash Kazemi <contact.arash.kazemi@gmail.com>
BSD-2-Clause
*/

import Lilact from "./lilact.jsx";
import { required_scripts } from "./run.jsx";
import { css } from "@emotion/css";

function number(value) {
	const result = Number(value);
	return Number.isFinite(result) ? result : null;
}

function asError(value) {
	if (value instanceof Error) return value;
	if (value?.error instanceof Error) return value.error;

	const error = new Error(
		value?.message == null
			? String(value)
			: String(value.message)
	);

	if (value && typeof value === "object") {
		if (value.name) error.name = value.name;
		if (value.stack) error.stack = value.stack;

		for (const key of Object.keys(value)) {
			if (!(key in error)) error[key] = value[key];
		}
	}

	return error;
}

function isParserError(error) {
	return error?.name === "JSXParserError";
}

function stackLocation(stack) {
	if (typeof stack !== "string") return null;

	for (const line of stack.split(/\r?\n/)) {
		const match = line.match(/(eval:\/.*):(\d+):(\d+)/);

		if (!match) continue;

		return {
			path: match[1].replace(/^eval:\/+/, ""),
			line: Number(match[2]) - 1,
			column: Number(match[3]) - 1,
		};
	}

	return null;
}

function browserLocation(error) {
	const line = number(
		error?.lineNumber ??
		error?.lineno ??
		error?.line
	);

	const column = number(
		error?.columnNumber ??
		error?.colno ??
		error?.column
	);

	return {
		line: line == null ? null : Math.max(0, line - 1),
		column: column == null ? null : Math.max(0, column - 1),
	};
}

function traceBlock(error) {
	const trace = error?.lilact_trace;
	return Array.isArray(trace) ? trace[0] : trace;
}

function blockInfo(error) {
	const trace = traceBlock(error);
	return trace == null
		? null
		: Lilact.blocks_info?.labels?.[trace];
}

function mapLocation(mappings, line, column) {
	if (
		!Array.isArray(mappings) ||
		!mappings.length ||
		!Number.isFinite(line) ||
		!Number.isFinite(column)
	) {
		return { line, column };
	}

	const valid = mappings
		.filter(mapping =>
			Array.isArray(mapping) &&
			mapping.length >= 4 &&
			mapping
				.slice(0, 4)
				.every(value => Number.isFinite(Number(value)))
		)
		.sort((a, b) =>
			Number(a[0]) - Number(b[0]) ||
			Number(a[1]) - Number(b[1])
		);

	if (!valid.length) return { line, column };

	let selected = valid[0];

	for (const mapping of valid) {
		const generatedLine = Number(mapping[0]);
		const generatedColumn = Number(mapping[1]);

		if (
			generatedLine < line ||
			(
				generatedLine === line &&
				generatedColumn <= column
			)
		) {
			selected = mapping;
		} else {
			break;
		}
	}

	const generatedLine = Number(selected[0]);
	const generatedColumn = Number(selected[1]);
	const sourceLine = Number(selected[2]);
	const sourceColumn = Number(selected[3]);

	return {
		line:
			sourceLine +
			(line === generatedLine ? 0 : line - generatedLine),
		column:
			line === generatedLine
				? Math.max(0, sourceColumn + column - generatedColumn)
				: sourceColumn,
	};
}

export function traceError(value, runPath) {
	if (value?.isTraced) return value;

	const error = asError(value);
	const source = error.lilact_source;
	const stack = isParserError(error)
		? null
		: stackLocation(error.stack);
	const browser = isParserError(error)
		? {
				line: number(error.lineNumber),
				column: number(error.columnNumber),
			}
		: browserLocation(error);

	/*
	 * lilact_source is authoritative. In particular, it prevents a syntax
	 * error from a nested eval from inheriting the caller's eval filename.
	 */
	const fileName =
		source?.path ||
		stack?.path ||
		error.fileName ||
		runPath ||
		null;

	let line =
		stack?.line ??
		browser.line ??
		null;

	let column =
		stack?.column ??
		browser.column ??
		null;

	const result = {
		fileName,
		lineNumber: line,
		columnNumber: column,
		message:
			error.message == null
				? String(error)
				: String(error.message),
		name: error.name || "Error",
		stack: error.stack || null,
		lilact_source: source || null,
		_error: error,
		isTraced: true,
	};

	const module = fileName && required_scripts[fileName];

	if (module) {
		const mapped = mapLocation(
			module.mappings,
			result.lineNumber,
			result.columnNumber
		);

		result.lineNumber = mapped.line;
		result.columnNumber = mapped.column;
	}

	const block = blockInfo(error);

	if (
		block &&
		(
			result.lineNumber == null ||
			result.columnNumber == null ||
			!result.fileName
		)
	) {
		result.fileName ||= block.path || runPath || null;
		result.lineNumber ??= block.line;
		result.columnNumber ??= block.col;
		result.label = block.desc;
	}

	Lilact.error = result;
	return result;
}

function escapeHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function sourceExcerpt(module, line) {
	if (!module || !Number.isFinite(line)) return null;

	const lines = String(module.code ?? "").split(/\r?\n/);

	return {
		before: lines[line - 1] ?? "",
		current: lines[line] ?? "",
		after: lines[line + 1] ?? "",
	};
}

export function globalErrorHandler(eventOrError) {
	const value =
		eventOrError?.error instanceof Error
			? eventOrError.error
			: eventOrError?.reason !== undefined
				? eventOrError.reason
				: eventOrError;

	const error = traceError(
		value,
		eventOrError?.fileName || null
	);

	const excerpt = sourceExcerpt(
		required_scripts[error.fileName],
		error.lineNumber
	);

	const className = css(`
		background: linear-gradient(135deg, #fff2f2d4, #ffffffd4);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255,255,255,.25);
		border-radius: 5px;
		box-shadow: 0 10px 30px rgba(0,0,0,.35);
		overflow: hidden;
		min-width: 400px;
		width: 66%;

		red {
			color: #d00;
		}

		code {
			border: 1px solid #0003;
			overflow: auto;
			padding: 10px;
			display: block;
		}
	`);

	const dialog = document.createElement("dialog");
	dialog.className = className;

	const location = error.fileName
		? `At ${escapeHtml(error.fileName)}`
		: "";

	const line = Number.isFinite(error.lineNumber)
		? `: Line ${error.lineNumber + 1}`
		: "";

	const componentStack =
		error._error?.componentStackLog ||
		error._error?.componentStack ||
		"";

	dialog.innerHTML = `
		<h3><red>Error!</red></h3>
		<b>${location}${line}</b><br><br>
		<b>${escapeHtml(error.name)}</b>:
		<span>${escapeHtml(error.message)}</span>
		<br><br>

		${
			excerpt
				? "<code><pre></pre><red><pre></pre></red><pre></pre></code>"
				: ""
		}

		${
			componentStack
				? `
					<br>
					Component Stack:
					<br>
					<code><pre>${escapeHtml(componentStack)}</pre></code>
				`
				: ""
		}
	`;

	if (excerpt) {
		const pre = dialog.querySelectorAll("pre");
		pre[0].innerText = excerpt.before;
		pre[1].innerText = excerpt.current;
		pre[2].innerText = excerpt.after;
	}

	document.body.appendChild(dialog);

	if (typeof dialog.showModal === "function") {
		dialog.showModal();
	} else {
		dialog.setAttribute("open", "");
	}

	return error;
}

export function scanBlockLabels(code, path) {
	for (const match of String(code).matchAll(
		/LILACTBLOCK(\d+):(\d+),(\d+):([^*]+)\*\//gm
	)) {
		Lilact.blocks_info.labels[match[1]] = {
			path,
			line: Number(match[2]),
			col: Number(match[3]),
			desc: match[4],
		};
	}
}

export const blocks_info = {
	counter: 0,
	labels: {},
};

export let error = null;
