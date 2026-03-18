import Fastify from "fastify";

const app = Fastify();

app.get("/", async () => {
	return "TODO";
});

app.listen({ port: 3001 });
