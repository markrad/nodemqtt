FROM arm32v7/node:15-slim

WORKDIR /nodeMQTT

COPY --chown=1007:1007 ./nodemqtt ./
RUN ls 
RUN npm install

EXPOSE 9229
#CMD ["tail", "-f", "/etc/passwd"]
CMD [ "node", "nodemqtt.js", "-c", "/config/config.json" ]