document.addEventListener('DOMContentLoaded', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };

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
        .attr("transform", `translate(${margin.left},${height / 2})`);

    d3.json("data.json").then(data => {
        if (!data || !data.name) {
            console.error("No data loaded or incorrect format!");
            return;
        }

        const root = d3.hierarchy(data);
        root.x0 = height / 2;
        root.y0 = 0;

        const treeLayout = d3.tree().nodeSize([50, 200]);

        function update(source) {
            const treeData = treeLayout(root);
            const nodes = treeData.descendants();
            const links = treeData.links();

            nodes.forEach(d => d.y = d.depth * 200);

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
                .attr("dx", d => d.children || d._children ? -12 : 12)
                .attr("dy", 4)
                .style("text-anchor", d => d.children || d._children ? "end" : "start")
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
                .attr("d", d3.linkVertical()
                    .x(d => source.y0)
                    .y(d => source.x0));

            const linkUpdate = linkEnter.merge(link);

            linkUpdate.transition()
                .duration(500)
                .attr("d", d3.linkVertical()
                    .x(d => d.y)
                    .y(d => d.x));

            link.exit().transition()
                .duration(500)
                .attr("d", d3.linkVertical()
                    .x(d => source.y)
                    .y(d => source.x))
                .remove();

            nodes.forEach(d => {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        let i = 0;
        root.children.forEach(collapse);
        update(root);

        function collapse(d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
                d._children.forEach(collapse);
            }
        }
    }).catch(error => {
        console.error("Error loading JSON data:", error);
    });
});
