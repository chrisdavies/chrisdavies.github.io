# SQLite vs the file system

Out of curiosity, I ran a little test of SQLite vs the file system (btrfs). The conclusion? SQLite is probably faster for real-world loads.

## Linear writes

The first thing I did was test 10k inserts, written in a tight loop.

```bash
SQLite      647ms, 809ms, 708ms
BTRFS       393ms, 371ms, 382ms
```

For sequential writes, the file system is 1.8x faster.

## Concurrent writes

Next, I cranked up the concurrency and had 100 concurrent writers, each writing 1K records.

```bash
SQLite        8.2s, 8.1s, 8.5s
BTRFS         3.1s, 3.4s, 3.4s
```

For concurrent writes, the file system is 2.4x faster.

This is not terribly surprising, as SQLite does not handle concurrent writes. To be honest the performance gap here is smaller than I'd have guessed.

- SQLite can write around 12K inserts per second
- BTRFS can write around 30K files per second

## A more realistic test

The real-world application I'll be writing would have a bit more structure and more indices. So, I think the next test will be to run N tasks from start to finish: insert, update status, update progress, delete.

For this, we'll want to index by status, and in the real world, I'd *probably* also index by `scheduled_at` so that we can handle job scheduling efficiently. If I were to use the file system for this, I'd keep the queues and schedules in memory, and rebuild it when the application starts. I've tested the in-memory approach, and it's blisteringly fast (millions of ops per second, given proper care).

Concurrency: 100, each running a simulation of 100 tasks (create, change status, update "output" 10 times, delete):

```bash
SQLite      11.5s, 10.3s, 7.8
BTRFS       3.3s, 3.2s, 2.4s
```

In this test, the file system was 3.3x faster than SQLite. This surprises me, since we're writing the *entire* file each time vs SQLite presumably being able to do more optimal, in-place updates (though a variety of things may mean that's not actually happening).

Something to note is that SQLite has quite a bit of variation in its results, and seems to get faster with time.

Let's try again. This time, we'll do proper file writes (write to a tmp file, rename to overwrite the current file). This should be a *bit* more crash-resistant, though for my use case, it probably doesn't matter a whole lot if one or two tasks fail due to crashes once or twice a year.

## More resilient file writes

Interesting. This time, I modified my file simulation to write to a tmp file first, then rename it to overwrite the existing file. This tweak caused the file simulation to be a bit slower than SQLite:

```bash
SQLite      9.6s, 9.6s, 7.9s
BTRFS       13.5s, 13.3s, 10.2s
```

This makes me think that *probably* my initial file tests weren't waiting for fsync, but the rename forces the application to wait. I'm not sure.

Again, SQLite seems to speed up a bit as it goes along.

Here's another run, just with SQLite:

```bash
SQLite ran 10k tasks 10.83936393s
SQLite ran 10k tasks 10.27817409s
SQLite ran 10k tasks 8.891015857s
SQLite ran 10k tasks 6.528546715s
SQLite ran 10k tasks 6.738008705s
SQLite ran 10k tasks 6.917476809s
```

It seems to have a warm up phase or something. My guess is that it optimizes the queries over time and / or ends up caching the execution plan after some repetition.

Eeeenterestink. I think that I'll give SQLite the edge here, as it will be hosted in a long-running process, and will probably end up performing on the faster-end of these ranges.

## Conclusion

For a my real(ish) world scenario, SQLite-- once warmed up-- is *roughly* twice as fast as the file system.

I'm not sure which I'll end up going with, for my toy project, but I think it'll be SQLite. The devops part of me has a slight preference for using the file system, as I can use basic tools (grep, ls, etc) to check on things. The dev part of me definitely pefers SQLite, as I can let it take care of loads of things for me that I'd otherwise have to do myself, and I can trivially query for stats, etc.

## Footnotes

- I used [mattn/go-sqlite3](https://github.com/mattn/go-sqlite3)
  - These were the settings: `./tmp.db?_timeout=5000&_journal=WAL&_sync=1`
- My machine: 2020 Dell XPS SSD, Fedora 35, btrfs
- The project is [here](https://github.com/chrisdavies/dbench)
- In a separate project, I ran tests vs Postgres and found the performance was roughly the same as SQLite's worst performance when Postgres is hosted on the same machine.
