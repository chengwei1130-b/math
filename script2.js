document.addEventListener("DOMContentLoaded", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select("#mindmap-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom()
            .scaleExtent([0.5, 5])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            })
        );

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    d3.json("data.json").then(data => {
        if (!data || !data.name) {
            console.error("No data loaded or incorrect format!");
            return;
        }

        const root = d3.hierarchy(data);
        root.x0 = height / 2;
        root.y0 = 0;

        // Function to assign positions recursively
        function assignPositions(node, position) {
            node.data.position = position;
            if (node.children) {
                node.children.forEach(child => assignPositions(child, position));
            }
        }

        // Assign positions to the first-level children
        const half = Math.ceil(root.children.length / 2);
        root.children.forEach((d, i) => {
            const position = i < half ? "left" : "right";
            assignPositions(d, position);
        });

        const treeLayout = d3.tree().nodeSize([50, 200]);

        // Collapse the node and all its children
        function collapse(node) {
            if (node.children) {
                node._children = node.children;
                node._children.forEach(collapse);
                node.children = null;
            }
        }

        // Collapse all nodes by default
        root.children.forEach(collapse);

        function update(source) {
            const treeData = treeLayout(root);
            const nodes = treeData.descendants();
            const links = treeData.links();

            nodes.forEach(d => {
                d.y = d.depth * 180 * (d.data.position === "left" ? -1 : 1);
            });

            const node = g.selectAll(".node")
                .data(nodes, d => d.id || (d.id = ++i));

            const nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("transform", d => `translate(${source.y0},${source.x0})`)
                .on("click", (event, d) => {
                    if (d.children) {
                        d._children = d.children;
                        d.children = null;
                    } else {
                        d.children = d._children;
                        d._children = null;
                    }
                    update(d);
                });

            nodeEnter.append("circle")
                .attr("r", 8)
                .attr("fill", "#fff")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2);

            nodeEnter.append("text")
                .attr("dx", d => d.data.position === "left" ? -12 : 12)
                .attr("dy", 4)
                .style("text-anchor", d => d.data.position === "left" ? "end" : "start")
                .text(d => d.data.name)
                .style("fill", "#333")
                .style("font-size", "14px");

            const nodeUpdate = nodeEnter.merge(node);

            nodeUpdate.transition()
                .duration(500)
                .attr("transform", d => `translate(${d.y},${d.x})`);

            node.exit().transition()
                .duration(500)
                .attr("transform", d => `translate(${source.y},${source.x})`)
                .remove();

            const link = g.selectAll(".link")
                .data(links, d => d.target.id);

            const linkEnter = link.enter().insert("path", "g")
                .attr("class", "link")
                .attr("fill", "none")
                .attr("stroke", "#ccc")
                .attr("stroke-width", 2)
                .attr("d", d3.linkHorizontal()
                    .x(d => source.y0)
                    .y(d => source.x0));

            const linkUpdate = linkEnter.merge(link);

            linkUpdate.transition()
                .duration(500)
                .attr("d", d3.linkHorizontal()
                    .x(d => d.y)
                    .y(d => d.x));

            link.exit().transition()
                .duration(500)
                .attr("d", d3.linkHorizontal()
                    .x(d => source.y)
                    .y(d => source.x))
                .remove();

            nodes.forEach(d => {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        let i = 0;
        update(root);
    }).catch(error => {
        console.error("Error loading JSON data:", error);
    });
});
