/**
 * Function that create an html wrapper for all element inside of a given element, that can be usefull for creating a word-letter animation by creating a span for each letter of a word or words.
 * @function
 * @see charming
 * @param {HTMLElement} element - element that should be charmed (from witch all children will be wrapped).
 * @param {string} [options.tagName = 'span'] - html element name that will be a wrapper (eg. 'span', 'div', 'i'...)
 * @param {string} [options.type = 'letter'] - type of chunk to create (by 'letter' or 'word')
 * @param {number} [options.nesting = 1] - how much elements you need to wrap the content
 * @param {string} [options.classPrefix = 'char'] - the class that will be added the the wrapper in addition of a wrap counter
 * @returns {void} - Nothing
 * @example
 * import {charming} from "Utils/charming";
 * charming(document.querySelector('#title'), {classPrefix: 'div', classPrefix: 'char letter-'});
 */

type Option = {
  tagName: string;
  type: "letter" | "word";
  nesting: number;
  classPrefix: string;
};

export function charming(element: Element, options: Option) {
  options = options || {};

  const tagName = options?.tagName ?? "span",
    chunkType = options.type || "letter",
    nestingLevel = options.nesting || 1,
    classPrefix = options.classPrefix != null ? options.classPrefix : chunkType;
  let count = 1;

  function inject(element: Element) {
    const parentNode = element?.parentNode ?? document,
      string = element.nodeValue || "",
      content = chunkType === "letter" ? string : string.split(" ").map((word) => word + " "),
      length = content.length;

    let i = -1;
    const opening = [],
      ending = [];
    for (let i = 1; i < nestingLevel; i++) {
      opening.push(`<${tagName}>`);
      ending.push(`</${tagName}>`);
    }

    while (++i < length) {
      const node = document.createElement(tagName);
      if (classPrefix) {
        node.className = classPrefix + count;
        count++;
      }
      node.innerHTML = opening.join(" ") + content[i] + ending.join(" ");
      parentNode.insertBefore(node, element);
    }
    parentNode.removeChild(element);
  }

  (function traverse(element) {
    // `element` is itself a text node.
    if (element.nodeType === Node.TEXT_NODE) {
      return inject(element);
    }

    // `element` has a single child text node.
    const childNodes = Array.prototype.slice.call(element.childNodes), // static array of nodes
      length = childNodes.length;

    if (length === 1 && childNodes[0].nodeType === Node.TEXT_NODE) {
      return inject(childNodes[0]);
    }

    // `element` has more than one child node.
    let i = -1;
    while (++i < length) {
      traverse(childNodes[i]);
    }
  })(element);
}
