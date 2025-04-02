
import streamlit as st
import pandas as pd

st.set_page_config(page_title="Fashion Price Benchmark", layout="wide")

st.title("🛍️ Fashion & Lifestyle Price Benchmark")

# Mock data input
query = st.text_input("Search for a product (e.g., 'Jacquemus Bambino')", "")

if query:
    # Sample mock data
    data = {
        "Product": [query]*3,
        "Website": ["Zalando", "The Bradery", "Namshi"],
        "Price (Local)": ["€180", "€170", "SAR 850"],
        "Converted Price (SAR)": [722, 681, 850],
        "Link": [
            "https://www.zalando.com/",
            "https://www.thebradery.com/",
            "https://en-sa.namshi.com/"
        ]
    }
    df = pd.DataFrame(data)
    min_price = df["Converted Price (SAR)"].min()
    df["Status"] = df["Converted Price (SAR)"].apply(
        lambda x: "✅ Lowest" if x == min_price else ("⚠️ At Par" if abs(x - min_price) < 5 else "❌ More Expensive")
    )
    st.dataframe(df, use_container_width=True)
else:
    st.info("Enter a product name to see live benchmark results.")
