declare interface CanvasRenderingContext2D {
	drawLine(x1: number, y1: number, x2: number, y2: number);
}
declare interface String {
	startsWith(needle: string): boolean;
}
declare class SdkEditor {
	addElement(e, x, y);
}
declare interface ElementLayoutOptions {
	grow?: number;
	shrink?: number;
	alignSelf?: number;
	margin?: number;
}
declare class UIControl {
	layout: any;
	left: number;
	top: number;
	width: number;
	height: number;
	tabIndex: number;
	visible: boolean;
	parent: UIContainer;
	protected _ctl: HTMLElement;

	constructor(options);
	setOptions(options);
	setLayoutOptions(options: ElementLayoutOptions);
	free();
	show();
	hide();
	addListener(event, callback);
	getControl(): HTMLElement;
	setDisabled(value);
	place(x, y, w, h);
	appendTo(node: HTMLElement);
}
declare class UIContainer extends UIControl {
	add(control);
	getContainer(): HTMLElement;
	remove(control);
	removeAll();
	insert(control: UIControl, before: UIControl);
	each(callback);
	get(index: number): UIControl;
}
declare class Panel extends UIContainer {
}
declare class Dialog extends UIContainer {
	caption: string;
	form: HTMLElement;
	getButton(index: number): HTMLElement;
}
declare class Edit extends UIControl {
	text: string;
}
declare class Label extends UIControl {
	caption: string;
}
declare class Button extends UIControl {
}
declare class UIImage extends UIControl {
	url: string;
}
declare class TabControl extends UIContainer {
	onclose: (tab: Tab) => void;
	onselect: (tab: Tab) => void;
	addTab(name, title);
	select(tab: Tab);
}
declare class UILoader extends UIControl {
}
declare class TrackBar extends UIControl {
	position: number;
}
declare class Tab extends UIControl {
	icon: string;
	caption: string;
	title: string;
	save(value);
	load(value);
}
declare class Spoiler extends UIControl {
	opened: boolean;
	body(): Builder;
	onchange:() => void;
}
declare class Splitter extends UIControl {
	onresize:() => void;
	setManage(control: UIControl);
}
declare class ToolButton extends UIControl {
	enabled: boolean;
	checked: boolean;
	tag: any;
}
declare class ToolBar extends UIControl {
	constructor(buttons: Array<any>);
	getButtonByTag(name: string);
	each(callback:(item: ToolButton) => void);
}
declare class ListBox extends UIControl {
	items:Array<string>;
	onselect: (item, text) => any;
	oncheck: (item, text) => any;
	clear();
	size();
	addIcon(text, icon);
	selectIndex(index);
	checked(item, value);
}
declare class UISimpleTable extends UIControl {
	onrowselect: (item, index) => any;
	onrowclick: (item, index) => any;
	getSelectionRow();
	clear();
	addRow(data);
}
declare class InfoPanel {
	error(text: string);
	info(text: string);
}
declare interface LayoutOptions {
	wrap?: number;
	justifyContent?: number;
	alignItems?: number;
	alignContent?: number;
	padding?: number;
}
declare class VLayout {
	constructor(element: any, options: LayoutOptions);
}
declare class HLayout {
	constructor(element: any, options: LayoutOptions);
}
declare class FixLayout {
	constructor(element: any);
}
declare class Builder {
	element: HTMLElement;

	constructor(element: HTMLElement);
	constructor();
	n(element: string): Builder;
	div(className: string): Builder;
	span(className: string): Builder;
	checkbox(className: string): Builder;
	inputbox(className: string): Builder;
	class(name: string): Builder;
	html(name: string): Builder;
	id(name: string): Builder;
	checked(value: boolean): Builder;
	checked(): boolean;
	value(value: string): Builder;
	value(): string;
	scrollLeft(value: number): Builder;
	scrollLeft(): number;
	scrollTop(value: number): Builder;
	scrollTop(): number;
	attr(name: string, value: any): Builder;
	htmlAttr(name: string, value: any): Builder;
	style(name: string, value: any): Builder;
	on(name: string, func: any): Builder;
	append(node: HTMLElement):Builder;
	childs(): number;
	child(index: number): HTMLElement;
	parent(): Builder;
	show(): Builder;
	hide(): Builder;
	render(): Builder;
	erase(): Builder;
	move(x: number, y: number): Builder;
	size(w: number, h: number): Builder;
}

declare interface HTMLElement {
	hide();
	show();
	// width(value: number);
	// height(value: number);
	dialog(options): HTMLElement;
}

declare function CodeMirror(element, options);
declare interface CodeMirror {
	fromTextArea(element, options);
}

declare var $: any;
// declare var $: { get: any; appendScript: any; }