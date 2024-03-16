namespace TinyReact {
  export namespace JSX {
    export interface Element {
      type: any;
      props: any;
    }
    export interface IntrinsicElements {
      [elemName: string]: any;
    }
  }

  interface Props {
    children: TinyReactElement[];
    [index: string]: any;
  }
  type FunctionComponentElementType<P extends Props> = (
    props: P
  ) => JSX.Element;
  type ElementType = string | FunctionComponentElementType<any>;

  interface TinyReactElement extends JSX.Element {
    type: ElementType;
    props: Props;
  }

  interface TinyReactTextElement extends TinyReactElement {
    type: "_TEXT_ELEMENT_";
    props: {
      nodeValue: string;
      children: [];
    };
  }

  interface FiberBase {
    props: Props;
    dom: DomType | null;
    parent?: Fiber;
    child?: Fiber;
    sibling?: Fiber;
  }

  interface NoTypeFiber extends FiberBase {
    type: undefined;
  }

  interface CommonFiber extends FiberBase {
    type: string;
  }

  interface FunctionComponentFiber extends FiberBase {
    type: FunctionComponentElementType<any>;
  }

  type Fiber = NoTypeFiber | CommonFiber | FunctionComponentFiber;

  export function createElement(
    type: ElementType,
    props: Props,
    ...children: any[]
  ): JSX.Element {
    return {
      type,
      props: {
        ...props,
        children: children.map((child) =>
          typeof child === "object" ? child : createTextElement(child)
        ),
      },
    };
  }

  function createTextElement(text: any): TinyReactTextElement {
    return {
      type: "_TEXT_ELEMENT_",
      props: {
        nodeValue: `${text}`,
        children: [],
      },
    };
  }

  const isProperty = (key: string) => key !== "children";

  type DomType = (HTMLElement | Text) & { [index: string]: any };

  function createDom(fiber: CommonFiber) {
    const dom: DomType =
      fiber.type === "_TEXT_ELEMENT_"
        ? document.createTextNode("")
        : document.createElement(fiber.type);

    Object.keys(fiber.props)
      .filter(isProperty)
      .forEach((name) => (dom[name] = fiber.props[name]));

    return dom;
  }

  function commitRoot() {
    commitWork(wipRoot?.child || null);
    wipRoot = null;
  }

  function commitWork(fiber: Fiber | null) {
    if (!fiber) {
      return;
    }
    const domParent = fiber.parent?.dom;
    fiber.dom && domParent?.appendChild(fiber.dom);
    commitWork(fiber.child || null);
    commitWork(fiber.sibling || null);
  }

  export function render(
    element: TinyReactElement,
    container: HTMLElement | Text | null
  ) {
    if (container === null) {
      return;
    }

    wipRoot = {
      dom: container,
      props: {
        children: [element],
      },
      type: undefined,
    };

    nextUnitOfWork = wipRoot;
  }

  let nextUnitOfWork: Fiber | null = null;
  let wipRoot: Fiber | null = null;

  function workLoop(deadline: IdleDeadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      shouldYield = deadline.timeRemaining() < 1;
    }
    if (!nextUnitOfWork && wipRoot) {
      commitRoot();
    }
    requestIdleCallback(workLoop);
  }

  requestIdleCallback(workLoop);

  function performUnitOfWork(fiber: Fiber): Fiber | null {
    if (typeof fiber.type === "string") {
      if (!fiber.dom) {
        fiber.dom = createDom(fiber);
      }
    }

    const elements = fiber.props.children;
    let index = 0;
    let prevSlibing: Fiber | null = null;

    while (index < elements.length) {
      const element = elements[index];

      const newFiber: Fiber = {
        type: element.type,
        props: element.props,
        parent: fiber,
        dom: null,
      };

      if (index === 0) {
        fiber.child = newFiber;
      } else {
        prevSlibing!.sibling = newFiber;
      }

      prevSlibing = newFiber;
      index++;
    }

    if (fiber.child) {
      return fiber.child;
    }
    let nextFiber: Fiber | null = fiber;
    while (nextFiber) {
      if (nextFiber.sibling) {
        return nextFiber.sibling;
      }
      nextFiber = nextFiber.parent || null;
    }

    return null;
  }
}

export default TinyReact;
