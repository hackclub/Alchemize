# Mixing

The Trade Portal allows you to convert theme currencies into **Potion Mix**, Alchemize's universal currency.

You can access it from:

```text
/dashboard/trade
```

At first glance, it looks like a currency converter.

In reality, it's a small optimization puzzle.

---

## Base Conversion Rates

Every theme currency has a Potion Mix value.

| Currency   | Value |
| ---------- | ----- |
| Redstone   | 4     |
| Glowstone  | 4.5   |
| Aqua Regia | 5     |

Without any bonuses:

* 1 Redstone → 4 Potion Mix
* 1 Glowstone → 4.5 Potion Mix
* 1 Aqua Regia → 5 Potion Mix

If you converted everything separately, these are the rates you would receive.

---

## Mixing Bonus

When lower-value currencies are converted alongside higher-value currencies, some of the lower-value currency is upgraded.

Think of it as stronger ingredients improving weaker ingredients during the mixing process.

The number of upgraded points is limited by the amount of higher-value currency involved in that trade.

This prevents a single high-value currency from boosting an unlimited number of lower-value currencies.

---

## Example 1

Trading:

* 2 Redstone
* 1 Glowstone

### Without Mixing

```text
2 × 4 + 1 × 4.5 = 12.5 Potion Mix
```

### With Mixing

One Redstone is upgraded to Glowstone's value.

```text
1 × 4
+ 1 × 4.5
+ 1 × 4.5
= 13 Potion Mix
```

Bonus earned:

```text
0.5 Potion Mix
```

---

## Example 2

Trading:

* 5 Redstone
* 2 Glowstone

Only 2 Redstone can be upgraded because only 2 Glowstone are present.

### With Mixing

```text
3 × 4
+ 2 × 4.5
+ 2 × 4.5
= 30 Potion Mix
```

### Without Mixing

```text
5 × 4 + 2 × 4.5 = 29 Potion Mix
```

Bonus earned:

```text
1 Potion Mix
```

---

## Example 3

Trading:

* 3 Glowstone
* 2 Aqua Regia

Two Glowstone are upgraded to Aqua Regia's value.

### With Mixing

```text
1 × 4.5
+ 2 × 5
+ 2 × 5
= 24.5 Potion Mix
```

### Without Mixing

```text
3 × 4.5 + 2 × 5 = 23.5 Potion Mix
```

Bonus earned:

```text
1 Potion Mix
```

---

## Example 4

Trading:

* 4 Redstone
* 3 Aqua Regia

Three Redstone are upgraded to Aqua Regia's value.

### With Mixing

```text
1 × 4
+ 3 × 5
+ 3 × 5
= 34 Potion Mix
```

### Without Mixing

```text
4 × 4 + 3 × 5 = 31 Potion Mix
```

Bonus earned:

```text
3 Potion Mix
```

---

## Bonus Rules

### Redstone

Can receive upgrades from:

* Glowstone
* Aqua Regia

### Glowstone

Can receive upgrades from:

* Aqua Regia

### Aqua Regia

Already has the highest value and cannot be upgraded.

---

## Strategy

If your goal is a theme-exclusive reward, spending theme currencies directly is often the best choice.

If your goal is to maximize Potion Mix, building projects across multiple themes can be more rewarding.

The Trade Portal rewards variety. The more different ingredients you bring to the table, the more powerful your mixtures can become.
