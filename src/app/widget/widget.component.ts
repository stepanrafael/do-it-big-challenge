import {
  ChangeDetectorRef,
  Component,
  NgZone,
  ViewEncapsulation,
} from "@angular/core";
import { Action } from "./action/action.component";

enum States {
  selectElement = 1,
  selectAction = 2,
  actionSelection = 3,
  allowBot = 4,
}

@Component({
  selector: "app-widget",
  templateUrl: "./widget.component.html",
  styleUrls: ["./widget.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class WidgetComponent {
  readonly States = States;
  readonly IdentifySelectionByAttr = "selected";
  currentState = States.selectElement;
  actionName = "";
  actionDescription = "";
  selectedElements: HTMLElement[] = [];
  selectedElementsForAction: HTMLElement[] = [];

  actionsList: Action[] = [
    {
      id: "click",
      title: "Click a button",
      description: "Allows you to click on a button for each element",
      instruction: "Select elements to be clicked",
      icon: "Cursor.png",
      disabled: false,
    },
    {
      id: "input",
      title: "Input text",
      description: "Allows you to input text for each element",
      instruction: "Select inputs elements",
      icon: "Text.png",
      disabled: true,
    },
    {
      id: "store",
      title: "Store data",
      description: "Allows you to store data for each element",
      instruction: "Select any elements",
      icon: "Database.png",
      disabled: true,
    },
    {
      id: "aggregation",
      title: "Aggregation",
      description: "Allows you to aggregate data for each element",
      instruction: "Select any elements",
      icon: "List.png",
      disabled: true,
    },
    {
      id: "loop",
      title: "For loop",
      description: "Allows you to loop through each element",
      instruction: "Select any elements",
      icon: "Restart.png",
      disabled: true,
    },
  ];

  // For identifying the elements by a unique id
  get uniqueId() {
    return new Date().valueOf().toString();
  }

  /*
    Should be enhanced to parse and return the most popular selection
    based on tagName, class, id
  */
  get mostUsed(): HTMLElement | null {
    if (this.selectedElements.length > 1) {
      const element = this.selectedElements[0];
      if (element.parentElement) {
        return element;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  get allowHighlights(): boolean {
    return (
      this.currentState === States.selectElement ||
      this.currentState === States.actionSelection
    );
  }

  get allowClicks() {
    return this.selectedElementsForAction.length &&
      this.currentState === States.selectAction
      ? true
      : false;
  }

  constructor(private _ngZone: NgZone, private _cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this._ngZone.runOutsideAngular(() => {
      window.addEventListener(
        "mouseover",
        this.mouseOverEvent.bind(this),
        true
      );
      window.addEventListener("mouseout", this.mouseOutEvent.bind(this), true);
      window.addEventListener("click", this.clickEvent.bind(this), true);
    });
  }

  pickAction(action: Action) {
    if (!action.disabled) {
      this.actionName = action.title;
      this.actionDescription = action.instruction;
      this.currentState = States.actionSelection;
    }
  }

  resetAll(): void {
    this.removeElements();
    this.selectedElements = [];
    this.selectedElementsForAction = [];
    this.actionName = "";
    this.currentState = States.selectElement;
    this._cdr.detectChanges();
  }

  resetActions(): void {
    this.selectedElementsForAction.forEach(this.removeAction.bind(this));
  }

  save(): void {
    if (this.currentState === States.selectElement) {
      this.currentState = States.selectAction;
    }
    if (this.currentState === States.actionSelection) {
      this.currentState = States.allowBot;
    }
  }

  runBot(): void {
    this.selectedElementsForAction.forEach((element) => {
      element.click();
    });
    this.resetActions();
  }

  isInWidget(element: HTMLElement): boolean {
    return element.closest("#widget") ? true : false;
  }

  mouseOverEvent(event: Event): void {
    const element = event.target as HTMLElement;
    if (!this.isInWidget(element) && this.allowHighlights) {
      element.classList.add("highlighted");
    }
  }

  mouseOutEvent(event: Event): void {
    const element = event.target as HTMLElement;
    if (!this.isInWidget(element) && this.allowHighlights) {
      element.classList.remove("highlighted");
    }
  }

  clickEvent(event: Event): void {
    const element = event.target as HTMLElement;
    const clickedManually = event.isTrusted;

    // Everything should behave normal in the widget element
    // Alter functions for the website only
    if (!this.isInWidget(element)) {
      //
      if (clickedManually) {
        if (this.currentState === States.selectElement) {
          if (element.getAttribute(this.IdentifySelectionByAttr)) {
            this.removeElement(element);
          } else {
            this.addElement(element);
            this.applyPrediction();
          }
        } else if (this.currentState === States.actionSelection) {
          this.selectAction(element);
        }
        this._cdr.detectChanges();
        event.stopImmediatePropagation();
      }
    }
  }

  selectAction(element: HTMLElement): void {
    const exists = this.elementExistsInArray(
      this.selectedElementsForAction,
      element
    );

    if (exists) {
      this.removeAction(element);
    } else {
      this.addAction(element);
    }

    this._cdr.detectChanges();
  }

  addAction(element: HTMLElement): void {
    this.selectedElementsForAction.push(element);
    element.classList.add("selected-action");
    element.setAttribute(this.IdentifySelectionByAttr, this.uniqueId);
  }

  removeAction(element: HTMLElement): void {
    const index = this.elementIndexInArray(
      this.selectedElementsForAction,
      element
    );
    this.selectedElementsForAction.splice(index, 1);
    element.classList.remove("selected-action");
    element.removeAttribute(this.IdentifySelectionByAttr);
  }

  addElement(element: HTMLElement, className = "selected"): void {
    element.classList.add(className);
    element.setAttribute(this.IdentifySelectionByAttr, this.uniqueId);
    this.selectedElements.push(element);
    this._cdr.detectChanges();
  }

  removeElement(element: HTMLElement): void {
    const exists = this.elementExistsInArray(this.selectedElements, element);
    if (exists) {
      const index = this.elementIndexInArray(this.selectedElements, element);
      this.selectedElements.splice(index, 1);
    }
    element.classList.remove("selected");
    element.classList.remove("predicted");
    element.removeAttribute(this.IdentifySelectionByAttr);
    this._cdr.detectChanges();
  }

  elementExistsInArray(array: any[], element: HTMLElement): boolean {
    let exists = false;
    array.forEach((e) => {
      if (this.sameAttributes(e, element)) exists = true;
    });
    return exists;
  }

  elementIndexInArray(array: any[], element: HTMLElement): number {
    let index = 0;
    array.forEach((e, i) => {
      if (this.sameAttributes(e, element)) index = i;
    });
    return index;
  }

  sameAttributes(element1: HTMLElement, element2: HTMLElement): boolean {
    return (
      element1.getAttribute(this.IdentifySelectionByAttr) ===
      element2.getAttribute(this.IdentifySelectionByAttr)
    );
  }

  removeElements(): void {
    this.selectedElements.forEach(this.removeElement.bind(this));
  }

  applyPrediction(): void {
    if (this.mostUsed) {
      const tagName = this.mostUsed.tagName.toLowerCase();
      const parent = this.mostUsed.parentElement;
      // Select similar elements in the parent element
      // Similarities on the first level depth only
      const predictions = parent!.querySelectorAll(`:scope > ${tagName}`);

      predictions.forEach((e) => {
        // If element is not already added
        if (!e.getAttribute(this.IdentifySelectionByAttr))
          this.addElement(e as HTMLElement, "predicted");
      });
    }
  }
}
