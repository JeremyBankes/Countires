# Lux

## A modern configurable CSS stylesheet.

Lux is a pure, vanilla CSS stylesheet using variables to allow for user configuration!

Simply [link `lux.css` into your HTML](#using-lux) to apply the default styling, and [overwrite any of the variables to customize your look](#customizing-lux).

### Using Lux
Include this tag in the HTML you wish to style with Lux.
```HTML
<link rel="stylesheet" href="lux.css">
```

### Customizing Lux
Define this block in a CSS file or style tag _after_ Lux to override any styles.
```CSS
:root {
    /* Colors */
    --foreground-color-special: #ffffff;
    --foreground-color: #cccccc;
    --background-color: #1a1a1a;
    --background-color-special: #000000;
    --background-color-special: #0A0A0A;
    --input-background-color: #252525;
    --input-background-special: #2A2A2A;
    --accent-color: #0070A0;
    --accent-color-special: #2090D0;
    --border-color: #303030;

    /* Spacing */
    --space-smaller: 4px;
    --space-small: 8px;
    --space-medium: 12px;
    --space-large: 16px;
    --space-larger: 20px;

    /* Sizing */
    --input-size: 2rem;

    /* Weight */
    --weight-smaller: 1;
    --weight-small: 2;
    --weight-medium: 3;
    --weight-large: 4;
    --weight-larger: 5;

    /* Fonts */
    --font-family-regular: monospace;
    --font-weight-smaller: 200;
    --font-weight-small: 300;
    --font-weight-medium: 400;
    --font-weight-large: 700;
    --font-weight-larger: 800;

    --font-size-smaller: 12px;
    --font-size-small: 14px;
    --font-size-medium: 16px;
    --font-size-large: 18px;
    --font-size-larger: 20px;

    /* Borders */
    --border-width: 1px;
    --border: var(--border-width) solid var(--border-color);
    --border-radius: var(--space-small);

    /* Transition */
    --hover-transition-duration: 200ms;
}
```