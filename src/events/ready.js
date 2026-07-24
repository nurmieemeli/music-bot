export default {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`[Discord] Logged in as ${client.user.tag}.`);
    await client.lavalink.init({ id: client.user.id, username: client.user.username });
  },
};
