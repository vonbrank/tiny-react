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
    parent?: Fiber | null;
    child?: Fiber | null;
    sibling?: Fiber | null;
    alernate?: Fiber | null;
    effectTag?: "UPDATE" | "PLACEMENT" | "DELETION";
  }

  interface RootFiber extends FiberBase {
    type: undefined;
  }

  interface HostComponentFiber extends FiberBase {
    type: string;
  }

  interface FunctionComponentFiber extends FiberBase {
    type: FunctionComponentElementType<any>;
  }

  type Fiber = RootFiber | HostComponentFiber | FunctionComponentFiber;

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

  type DomType = (HTMLElement | Text) & { [index: string]: any };

  function createDom(fiber: HostComponentFiber) {
    const dom: DomType =
      fiber.type === "_TEXT_ELEMENT_"
        ? document.createTextNode("")
        : document.createElement(fiber.type);

    updateDom(dom, { children: [] }, fiber.props);

    return dom;
  }
  const isEvent = (key: string) => key.startsWith("on");
  const isProperty = (key: string) => key !== "children" && !isEvent(key);
  const isNew = (prev: Props, next: Props) => (key: string) =>
    prev[key] !== next[key];
  const isGone = (prev: Props, next: Props) => (key: string) => !(key in next);
  function updateDom(dom: DomType, prevProps: Props, nextProps: Props) {
    Object.keys(prevProps)
      .filter(isEvent)
      .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
      .forEach((name) => {
        const eventType = name.toLocaleUpperCase().substring(2);
        dom.removeEventListener(eventType, prevProps[name]);
      });
    Object.keys(prevProps)
      .filter(isProperty)
      .filter(isGone(prevProps, nextProps))
      .forEach((name) => (dom[name] = undefined));

    Object.keys(nextProps)
      .filter(isProperty)
      .filter(isNew(prevProps, nextProps))
      .forEach((name) => (dom[name] = nextProps[name]));
    Object.keys(nextProps)
      .filter(isEvent)
      .filter(isNew(prevProps, nextProps))
      .forEach((name) => {
        const eventType = name.toLocaleLowerCase().substring(2);
        dom.addEventListener(eventType, nextProps[name]);
      });
  }

  function commitRoot() {
    deletions!.forEach(commitWork);
    commitWork(wipRoot?.child || null);
    currentRoot = wipRoot;
    wipRoot = null;
  }

  function commitWork(fiber: Fiber | null) {
    if (!fiber) {
      return;
    }

    let domParentFiber = fiber.parent;
    while (domParentFiber && !domParentFiber.dom) {
      domParentFiber = domParentFiber.parent;
    }
    const domParent = domParentFiber?.dom || null;

    if (fiber.effectTag === "PLACEMENT" && fiber.dom) {
      domParent?.appendChild(fiber.dom);
    } else if (fiber.effectTag === "UPDATE" && fiber.dom) {
      updateDom(fiber.dom, fiber.alernate!.props, fiber.props);
    } else if (fiber.effectTag === "DELETION" && fiber.dom) {
      commitDeletion(fiber, domParent!);
    }

    commitWork(fiber.child || null);
    commitWork(fiber.sibling || null);
  }

  function commitDeletion(fiber: Fiber, domParent: DomType) {
    if (fiber.dom) {
      domParent.removeChild(fiber.dom);
    } else {
      commitDeletion(fiber.child!, domParent);
    }
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
      alernate: currentRoot,
    };
    deletions = [];
    nextUnitOfWork = wipRoot;
  }

  let nextUnitOfWork: Fiber | null = null;
  let wipRoot: Fiber | null = null;
  let currentRoot: Fiber | null = null;
  let deletions: Fiber[] | null = null;

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
    if (typeof fiber.type === "string" || fiber.type === undefined) {
      updateHostComponent(fiber);
    } else {
      updateFunctionComponent(fiber);
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

  function updateFunctionComponent(fiber: FunctionComponentFiber) {
    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children);
  }

  function updateHostComponent(fiber: HostComponentFiber | RootFiber) {
    if (!fiber.dom && fiber.type) {
      fiber.dom = createDom(fiber);
    }
    const elements = fiber.props.children;
    reconcileChildren(fiber, elements);
  }

  function reconcileChildren(wipFiber: Fiber, elements: TinyReactElement[]) {
    let index = 0;
    let oldFiber = wipFiber.alernate?.child || null;
    let prevSlibing: Fiber | null = null;

    while (index < elements.length || oldFiber != null) {
      const element = elements[index];
      let newFiber: Fiber | null = null;

      const sameType = oldFiber && element && element.type === oldFiber.type;

      if (sameType) {
        newFiber = {
          type: oldFiber!.type,
          props: element.props,
          dom: oldFiber!.dom,
          parent: wipFiber,
          alernate: oldFiber!,
          effectTag: "UPDATE",
        };
      } else if (element) {
        newFiber = {
          type: element.type,
          props: element.props,
          dom: null,
          parent: wipFiber,
          alernate: null,
          effectTag: "PLACEMENT",
        };
      } else if (oldFiber) {
        oldFiber.effectTag = "DELETION";
        deletions!.push(oldFiber);
      }

      if (oldFiber) {
        oldFiber = oldFiber.sibling || null;
      }

      if (index === 0) {
        wipFiber.child = newFiber;
      } else {
        prevSlibing!.sibling = newFiber;
      }

      prevSlibing = newFiber;
      index++;
    }
  }
}

export default TinyReact;
