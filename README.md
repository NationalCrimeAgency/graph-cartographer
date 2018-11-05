# Cartographer

Cartographer is a web based tool for visually creating graph mapping files for use with `mapper`.
It has been tested with recent versions of Firefox and Chrome.

## Usage

Cartographer can be used to either visualise an existing mapping, or to create a new mapping visually.

To visualise an existing mapping, paste the mapping into the text area at the bottom of the page.
You can make changes to this text and the visualisation will update.

Alternatively, use the tools on the right hand side of page to add new vertices or edges.
When adding either a vertex or an edge, you must provide a label before it will allow you to add them.
When adding edges, you will need to drag and drop between two vertices after clicking the `Add Edge` button.

You can add properties to vertices by selecting them and clicking the `Add Property` button.
If multiple properties with the same name are added, they will be merged.

Cartographer does not currently support all functionality of the mapping tool.
If you wish to include `filters` or `_except` statements, you will need to manually add these into the output outside of the tool.