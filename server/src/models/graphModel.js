import mongoose from "mongoose";

const graphSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true
		},
		source: { type: String, required: true },
		rootName: { type: String, required: true },
		fileName: { type: String, default: null },
		nodes: { type: [mongoose.Schema.Types.Mixed], default: [] },
		edges: { type: [mongoose.Schema.Types.Mixed], default: [] }
	},
	{ timestamps: true }
);

export const Graph = mongoose.models.Graph || mongoose.model("Graph", graphSchema);