[![CircleCI](https://circleci.com/gh/JeffAshton/influxdb-builder.svg?style=svg)](https://circleci.com/gh/JeffAshton/influxdb-builder)

# influxdb-builder

A declarative builder for influx databases.

## Installation

```
npm install -g influxdb-builder
```

## Usage

```
influxdb-builder <options>

  --influxUrl=VAL   The url to the influx database. Required.

  --username=VAL    The influx administrator username.

  --password=VAL    The influx administrator password.

  --database=VAL    The name of the database to build. Required.

  --definition=VAL  The path to the database definition (yml file or directory of yml files). Required.
                  
  --apply           If specified the database will be updated, otherwise, only a plan is generated.
```

Output is written using bunyan.  For pretty logs, pipe to bunyan:

```bash
bin/influxdb-builder \
    --influxUrl "http://localhost:8086" \
    --database "test" \
    --definition "example/resources.yml" \
    --apply | bunyan
```

## Definitions Format

```yml
retention_policies:

  '2hr':
    duration: '2h'
    replication: 2
    shard_duration: '1h'
    default: true

  '1year':
    duration: '365d'
    replication: 1
    shard_duration: '7d'

continuous_queries:

  'average_passengers':
    query: >
      SELECT mean(passengers) AS passengers
      INTO ${database}."1year".average_passengers
      FROM ${database}."2hr".bus_data
      GROUP BY time(1d)
    resample:
      every: '30m'
      for: '3d'
```
