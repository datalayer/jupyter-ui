import marimo

__generated_with = "0.25.0"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    import math

    return math, mo


@app.cell
def _(mo):
    mo.md("""
    # A marimo notebook on a Jupyter kernel

    Every cell below is a marimo cell: run one, and the cells that read what
    it defines run again. Move the slider — the same happens.
    """)
    return


@app.cell
def _(mo):
    radius = mo.ui.slider(1, 10, value=2, label="radius")
    radius
    return (radius,)


@app.cell
def _(math, radius):
    area = math.pi * radius.value ** 2
    return (area,)


@app.cell
def _(area, mo, radius):
    mo.md(f"""
    A circle of radius **{radius.value}** has an area of **{area:.2f}**.
    """)
    return


@app.cell
def _(mo, radius):
    mo.ui.table(
        [{"radius": r, "area": round(3.14159 * r**2, 2)} for r in range(1, radius.value + 1)],
        label="Areas up to the chosen radius",
    )
    return


if __name__ == "__main__":
    app.run()
