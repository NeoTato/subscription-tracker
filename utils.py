def to_monthly(subscription):
    if subscription.billing_cycle == "monthly":
        return subscription.price
    elif subscription.billing_cycle == "yearly":
        return subscription.price / 12
    elif subscription.billing_cycle == "weekly":
        return subscription.price * 4
    elif subscription.billing_cycle == "daily":
        return subscription.price * 30
    else:
        return subscription.price

def to_PHP(price, currency):
    if currency == "USD":
        return price * 60
    elif currency == "JPY":
        return price * 0.39
    else:
        return price