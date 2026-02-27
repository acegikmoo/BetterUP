# Better Uptime

### A website monitoring app

## Architecture Diagram

```mermaid
flowchart LR
    U[User / Client] -->|REST API| API[api service — Poem on :3000]

    API -->|CRUD websites/regions| PG[(PostgreSQL)]
    API -->|publish website records| WS[(Redis website_stream)]

    W[worker service] -->|read websites| WS
    W -->|HTTP checks every 10s| EXT[Monitored websites]
    W -->|write metrics| IFX[(InfluxDB — uptime_metrics)]
    W -->|down events| NS[(Redis notification_stream)]

    N[notification service] -->|consume alerts| NS
    N -->|send email| SMTP[SMTP server]

    subgraph Shared Libraries
      RL[redis_lib]
      ST[store]
    end

    API -. uses .-> ST
    W -. uses .-> RL
    N -. uses .-> RL

    classDef muted fill:#f5f5f5,stroke:#bbb,color:#666
```

### Component Notes

- **api**: handles CRUD for websites and regions
- **worker**: polls website URLs, writes uptime metrics to InfluxDB, and pushes down events to Redis.
- **notification**: consumes Redis notification events and sends email alerts.
- **redis_lib**: shared Redis stream access layer used by worker and notification.
- **db_processor**: just scaffolded
