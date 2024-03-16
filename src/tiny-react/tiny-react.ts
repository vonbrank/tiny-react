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
    children?: JSX.Element | JSX.Element[];
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

  export function render(
    element: TinyReactElement,
    container: HTMLElement | Text | null
  ) {
    if (container === null) {
      return;
    }

    if (typeof element.type === "string") {
      const dom: DomType =
        element.type === "_TEXT_ELEMENT_"
          ? document.createTextNode("")
          : document.createElement(element.type);

      Object.keys(element.props)
        .filter(isProperty)
        .forEach((name) => (dom[name] = element.props[name]));

      if (Array.isArray(element.props.children)) {
        element.props.children.forEach((child) => render(child, dom));
      } else if (element.props.children) {
        render(element.props.children, dom);
      }

      container.appendChild(dom);
    }
  }
}

export default TinyReact;
