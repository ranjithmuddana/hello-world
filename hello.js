# Custom serializer
def custom_serializer(obj):
    if isinstance(obj, pd.Series):
        return obj.tolist()  # Or obj.to_dict(), depending on your needs
    raise TypeError(f"Type {type(obj)} not serializable")

# Serialize with custom serializer
json_output = json.dumps(data, default=custom_serializer)
print(json_output)